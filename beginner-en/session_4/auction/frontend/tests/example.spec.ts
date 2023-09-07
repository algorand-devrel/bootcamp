import { randomAccount } from '@algorandfoundation/algokit-utils'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/')
})

test('has title', async ({ page }) => {
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle('AlgoKit React Template')
})

test('get started link', async ({ page }) => {
  await expect(page.getByTestId('getting-started')).toHaveText('Getting started')
})

test('authentication and dummy payment transaction', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    dialog.message() === 'KMD password' ? await dialog.accept() : await dialog.dismiss()
  })

  // 1. Must be able to connect to a KMD wallet provider
  await page.getByTestId('connect-wallet').click()
  await page.getByTestId('kmd-connect').click()
  await page.getByTestId('close-wallet-modal').click()

  // 2. Must be able to send a dummy payment transaction
  await page.getByTestId('transactions-demo').click()

  const dummyAccount = randomAccount()
  await page.getByTestId('receiver-address').fill(dummyAccount.addr)
  await page.getByTestId('send-algo').click()

  // 3. Must be able to see a notification that the transaction was sent
  const notification = await page.getByText('Transaction sent:')
  await notification.waitFor()
  expect(notification).toBeTruthy()
})
