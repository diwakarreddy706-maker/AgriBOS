import { query, get, run, runInTransaction } from '../db/database.js';

export const sequenceService = {
  /**
   * Generates the next document number atomically for a given prefix ('INV' or 'REC').
   * Example: 'INV-2026-000001', 'REC-2026-000001'
   */
  getNextSequenceNumber: async (prefix = 'INV', year = new Date().getFullYear(), client = null) => {
    const sequenceKey = `${prefix}_${year}`;

    const executeSeq = async (tx) => {
      let seq = await tx.get('SELECT * FROM document_sequences WHERE sequence_key = ?', [sequenceKey]);

      let nextVal = 1;
      if (seq) {
        nextVal = (Number(seq.current_val) || 0) + 1;
        await tx.run(
          'UPDATE document_sequences SET current_val = ?, updated_at = CURRENT_TIMESTAMP WHERE sequence_key = ?',
          [nextVal, sequenceKey]
        );
      } else {
        await tx.run(
          'INSERT INTO document_sequences (sequence_key, current_val) VALUES (?, ?)',
          [sequenceKey, nextVal]
        );
      }

      const paddedVal = String(nextVal).padStart(6, '0');
      return `${prefix}-${year}-${paddedVal}`;
    };

    if (client) {
      return await executeSeq(client);
    } else {
      return await runInTransaction(executeSeq);
    }
  }
};

export default sequenceService;
