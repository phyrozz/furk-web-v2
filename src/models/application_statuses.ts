export type ApplicationStatus = 'pending' | 'verified' | 'unverified' | 'rejected' | 'suspended';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}