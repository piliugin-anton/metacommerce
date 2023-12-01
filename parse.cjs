const fs = require('fs')
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

puppeteer.launch({ headless: 'new' }).then(async (browser) => {
  const page = await browser.newPage()
  await page.goto('https://www.dns-shop.ru/catalog/17a8d26216404e77/vstraivaemye-xolodilniki/')
  const element = await page.waitForSelector('[data-catalog-products=""] div.product-buy__price')
  const info = await page.evaluate(() => {
    const elements = [...document.querySelectorAll('a.catalog-product__name, [data-catalog-products=""] div.product-buy__price')]

    const result = []

    for (let index = 0; index < elements.length; index+=2) {
      const text = elements[index].textContent
      const price = elements[index + 1].childNodes[0].textContent

      result.push(`"${text}"|${price}`)
    }

    return result
  })
  
  const header = 'Наименование|Цена'
  info.unshift(header)

  const CSV = info.join('\n')
  fs.writeFileSync('result.csv', CSV)

  await element.dispose()
  await browser.close()
})