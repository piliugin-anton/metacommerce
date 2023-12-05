const fs = require('fs')
const { stringify } = require('csv-stringify/sync')
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

puppeteer.launch({ headless: 'new' }).then(async (browser) => {
  const page = await browser.newPage()
  await page.goto('https://www.dns-shop.ru/catalog/17a8d26216404e77/vstraivaemye-xolodilniki/', {
    waitUntil: 'networkidle2'
  })

  const productsListSelector = 'div.products-list__content'
  const productsList = await page.waitForSelector(productsListSelector, { visible: true })

  const paginationSelector = 'ul.pagination-widget__pages'
  if (await page.$(paginationSelector)) {
    const pagination = await page.waitForSelector(productsListSelector, { visible: true })
    const pages = await pagination.evaluate((page) => page.textContent)
    const totalPages = pages && pages.length > 1 ? parseInt(pages.substring(pages.length - 1), 10) : 1

    const buttonSelector = 'button.pagination-widget__show-more-btn'

    for (let currentPage = 1; currentPage < totalPages; currentPage++) {
      await page.waitForSelector(buttonSelector, { visible: true })
      await page.click(buttonSelector)
      await page.waitForSelector('div.catalog-preloader_active', { hidden: false })
      await page.waitForSelector('div.catalog-preloader_active', { hidden: true })
      await page.waitForTimeout(randomIntFromInterval(2134, 3456))
    }
  }
  

  const result = await page.evaluate(() => {
    const items = []

    const elements = [...document.querySelectorAll('a.catalog-product__name, div.product-buy__price')]

    if (!elements.length) return items

    for (let index = 0; index < elements.length; index += 2) {
      const text = elements[index].textContent
      const priceElement = elements[index + 1]
      const price = priceElement?.childNodes[0]?.textContent || priceElement.textContent

      items.push([text, price])
    }

    return items
  })
  
  if (result.length) {
    const csv = stringify([
      ['Наименование', 'Цена'],
      ...result
    ])
    
    fs.writeFileSync('result.csv', csv, { encoding: 'utf8' })
  } else {
    console.log('Не найдено товаров')
  }

  await productsList.dispose()
  await browser.close()
})