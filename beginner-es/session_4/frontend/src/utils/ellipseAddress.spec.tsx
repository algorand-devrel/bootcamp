import { ellipseAddress } from './ellipseAddress'

describe('ellipseAddress', () => {
  it('should return ellipsed address with specified width', () => {
    const address = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const result = ellipseAddress(address, 4)
    expect(result).toBe('aaaa...aaaa')
  })

  it('should return empty string when address is empty', () => {
    const address = ''
    const result = ellipseAddress(address)
    expect(result).toBe('')
  })
})
