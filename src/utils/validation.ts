import { GoalInput, SavingInput } from '../types/models';
import { validAmount } from './currency';
import { validateDate } from './dates';
export function validateRegistration(
  fullName: string,
  username: string,
  password: string,
  confirm: string,
) {
  if (!fullName.trim()) {
    throw new Error('Please enter your full name.');
  }
  if (!/^[a-zA-Z0-9_]{4,32}$/.test(username.trim())) {
    throw new Error('Username must be 4–32 letters, numbers, or underscores.');
  }
  if (password.length < 6 || password.length > 128) {
    throw new Error('Use a password with 6–128 characters.');
  }
  if (password !== confirm) {
    throw new Error('Your passwords do not match.');
  }
}
export function validateGoal(input: GoalInput) {
  if (!input.name.trim() || input.name.trim().length > 80) {
    throw new Error('Enter a goal name with 1–80 characters.');
  }
  validAmount(input.targetAmount);
  if (input.targetDate) {
    validateDate(input.targetDate);
  }
}
export function validateSaving(input: SavingInput) {
  validAmount(input.amount);
  validateDate(input.transactionDate);
}
