import { get, run } from '../db/sqlite.js';

export const userRepository = {
  findByUsername: async (username) => {
    return await get('SELECT * FROM users WHERE username = ? AND is_deleted = 0', [username]);
  },

  findById: async (id) => {
    return await get('SELECT id, username, full_name, email, roles FROM users WHERE id = ? AND is_deleted = 0', [id]);
  },

  createUser: async ({ username, passwordHash, fullName, email, roles }) => {
    const rolesJson = JSON.stringify(roles || ['ROLE_USER']);
    const result = await run(
      `INSERT INTO users (username, password_hash, full_name, email, roles) VALUES (?, ?, ?, ?, ?)`,
      [username, passwordHash, fullName, email, rolesJson]
    );
    return await userRepository.findById(result.lastID);
  }
};

export default userRepository;
