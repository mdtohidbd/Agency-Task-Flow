import { Request, Response } from 'express';
import { db } from '../db/store.js';

export const financeController = {
  // GET /finance
  async getEntries(req: Request, res: Response) {
    try {
      const { month, entryType, projectId } = req.query;
      const entries = await db.getFinanceEntries({
        month: month as string | undefined,
        entryType: entryType as string | undefined,
        projectId: projectId as string | undefined,
      });
      res.json({ success: true, data: entries });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  },

  // POST /finance
  async createEntry(req: Request, res: Response) {
    try {
      const body = req.body;
      if (!body.entryType || !body.amount || !body.date || !body.description) {
        return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'entryType, amount, date, description are required.' } });
      }
      // Auto-compute amountBDT if currency is USD
      const settings = await db.getFinanceSettings();
      const rate = settings.usdToBdtRate || 110;
      const amountBDT = body.currency === 'USD' ? body.amount * rate : body.amount;

      const entry = await db.createFinanceEntry({ ...body, amountBDT });
      res.status(201).json({ success: true, data: entry });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  },

  // PATCH /finance/:id
  async updateEntry(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const body = req.body;
      // Recompute amountBDT if amount or currency changed
      if (body.amount !== undefined || body.currency !== undefined) {
        const existing = (await db.getFinanceEntries()).find(e => e.id === id);
        const settings = await db.getFinanceSettings();
        const rate = settings.usdToBdtRate || 110;
        const amount = body.amount ?? existing?.amount ?? 0;
        const currency = body.currency ?? existing?.currency ?? 'BDT';
        body.amountBDT = currency === 'USD' ? amount * rate : amount;
      }
      const updated = await db.updateFinanceEntry(id, body);
      if (!updated) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Finance entry not found.' } });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  },

  // DELETE /finance/:id
  async deleteEntry(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = await db.deleteFinanceEntry(id);
      if (!deleted) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Finance entry not found.' } });
      res.json({ success: true, data: { id } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  },

  // GET /finance/report?month=YYYY-MM
  async getReport(req: Request, res: Response) {
    try {
      const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
      const report = await db.getMonthlyReport(month);
      res.json({ success: true, data: report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  },

  // GET /finance/settings
  async getSettings(req: Request, res: Response) {
    try {
      const settings = await db.getFinanceSettings();
      res.json({ success: true, data: settings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  },

  // PATCH /finance/settings
  async updateSettings(req: Request, res: Response) {
    try {
      const updated = await db.updateFinanceSettings(req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  },
};
