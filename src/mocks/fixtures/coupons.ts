export interface CouponRule {
  code: string
  percentOff?: number
  amountOffEth?: string
  expiresAt: string
}

export const COUPON_FIXTURES: CouponRule[] = [
  { code: 'KURIO10', percentOff: 10, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'GENESIS', amountOffEth: '0.05', expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'EXPIRADO', percentOff: 20, expiresAt: '2025-01-01T00:00:00.000Z' },
]