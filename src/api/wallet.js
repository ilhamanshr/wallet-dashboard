import client from './client';

export const registerUser = (username) =>
  client.post('/user', { username }).then((r) => r.data);

export const getBalance = () => client.get('/balance').then((r) => r.data);

export const topup = (amount) =>
  client.post('/topup', { amount }).then((r) => r.data);

export const transfer = (toUsername, amount) =>
  client
    .post('/transfer', { to_username: toUsername, amount })
    .then((r) => r.data);

export const getTopTransactions = () =>
  client.get('/top_transactions_per_user').then((r) => r.data);

export const getTopUsers = () => client.get('/top_users').then((r) => r.data);
