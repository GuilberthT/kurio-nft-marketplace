import type { EthAmount } from "@/types/nft";

const DECIMALS = 18
const SCALE = 10n ** BigInt(DECIMALS)

export function parseEth(value: EthAmount): bigint {
    if (!/^\d+(\.\d{1,18})?$/.test(value)) {
        throw new Error(`Valor em ETH inválido: '${value}'`)
    }
    const [whole, fraction =''] = value.split('.')
    return BigInt(whole) * SCALE + BigInt(fraction.padEnd(DECIMALS, '0'))
}

export function formatEth(wei: bigint, maxDecimals = 4): EthAmount {
    const sign = wei < 0n ? '-' : ''
    const abs = wei < 0n ? -wei : wei
    const whole = abs / SCALE
    const fraction = (abs % SCALE)
        .toString()
        .padStart(DECIMALS, '0')
        .slice(0, maxDecimals)
        .replace(/0+$/, '')
        .padEnd(2,'0')
    return `${sign}${whole.toString()}.${fraction}`
}

export function sumEth(values: EthAmount[]): EthAmount {
    return formatEth(values.reduce((total,value) => total + parseEth(value), 0n))
}

export function multiplyEth(value: EthAmount, quantity: number): EthAmount {
    return formatEth(parseEth(value) * BigInt(quantity))
}