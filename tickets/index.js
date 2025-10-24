const { Pool } = require('pg');
const pool = require('../database');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');

class TicketManager {
  constructor(client) {
    this.client = client;
  }

  async init() {
    // Load active tickets into memory
    const res = await pool.query('SELECT channel_id, user_id, ticket_type, opened_at FROM ticket_active');
    this.activeTickets = {};
    for (const row of res.rows) {
      this.activeTickets[String(row.channel_id)] = {
        channel_id: String(row.channel_id),
        user_id: String(row.user_id),
        ticket_type: row.ticket_type,
        opened_at: row.opened_at
      };
    }
    // runtime helpers to prevent race conditions and spam
    this.pendingOpens = new Set(); // keys: guildId:userId
    this.closingLocks = new Set(); // keys: channelId
    this.lastClick = new Map(); // keys: guildId:userId:customId -> timestamp
    this.COOLDOWN_MS = -; // milisecond cooldown per button per user
  }

  // Buttons/panel
  async getPanel(guildId) {
    try {
      const res = await pool.query('SELECT channel_id, message_id, category_id, log_channel_id, title, description FROM ticket_panels WHERE guild_id = $1', [guildId]);
      return res.rows[0] || null;
    } catch (e) {
      // If the DB schema doesn't have title/description columns (older schema),
      // fallback to selecting the known columns only for backwards compatibility.
      if (e && e.code === '42703') {
        const res2 = await pool.query('SELECT channel_id, message_id, category_id, log_channel_id FROM ticket_panels WHERE guild_id = $1', [guildId]);
        return res2.rows[0] || null;
      }
      throw e;
    }
  }

  // Build panel embed and components from DB configuration
  async buildPanelPayload(guildId) {
    const panel = await this.getPanel(guildId);
    const buttons = await this.listButtons(guildId) || [];
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

    const embed = new EmbedBuilder()
      .setTitle(panel && panel.title ? panel.title : '🎫 Support Ticket')
      .setDescription(panel && panel.description ? panel.description : 'Klik tombol untuk membuat tiket sesuai kebutuhan kamu.')
      .setFooter({ text: 'KirikuDev Ticket system' })
      .setColor(0x0000ff);

    const rows = [];
    if (buttons.length > 0) {
      const row = new ActionRowBuilder();
      const styleMap = { 1: ButtonStyle.Primary, 2: ButtonStyle.Secondary, 3: ButtonStyle.Success, 4: ButtonStyle.Danger };
      for (const btn of buttons) {
        row.addComponents(new ButtonBuilder().setCustomId(btn.custom_id).setLabel(btn.label).setStyle(styleMap[btn.style] || ButtonStyle.Secondary));
      }
      rows.push(row);
    }

    // NOTE: admin action buttons (refresh/edit) removed — admin actions will refresh
    // the stored panel automatically when buttons are added/removed via admin commands.

    return { embed, components: rows };
  }

  // Refresh the existing panel message (edit embed & components)
  async refreshPanel(guildId) {
    const panel = await this.getPanel(guildId);
    if (!panel || !panel.channel_id || !panel.message_id) throw new Error('Panel not configured');
    const guild = this.client.guilds.cache.get(String(guildId));
    if (!guild) throw new Error('Guild not cached');
    const channel = guild.channels.cache.get(String(panel.channel_id));
    if (!channel) throw new Error('Panel channel not found');
    const msg = await channel.messages.fetch(String(panel.message_id));
    if (!msg) throw new Error('Panel message not found');
    const payload = await this.buildPanelPayload(guildId);
    await msg.edit({ embeds: [payload.embed], components: payload.components });
    return true;
  }

  async setPanel(guildId, data) {
    const query = `INSERT INTO ticket_panels (guild_id, channel_id, message_id, category_id, log_channel_id)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (guild_id) DO UPDATE SET channel_id = EXCLUDED.channel_id, message_id = EXCLUDED.message_id, category_id = EXCLUDED.category_id, log_channel_id = EXCLUDED.log_channel_id`;
    const vals = [guildId, data.channel_id || null, data.message_id || null, data.category_id || null, data.log_channel_id || null];
    await pool.query(query, vals);
  }

// 100 first line commit, thanks...
