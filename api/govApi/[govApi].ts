import { NowRequest, NowResponse } from '@vercel/node';
import pptr from 'puppeteer-core';
import chrome from 'chrome-aws-lambda';

const apisConhecidas = [
  'PortalGeral',
  'PortalGeralApi',
  'PortalRegiao',
  'PortalEstado',
  'PortalSintese',
  'PortalMunicipio',
  'PortalGeral',
  'PortalRegiaoSaude',
  'PortalRegiaoUf',
  'PortalCasos',
];

async function gov(path: string): Promise<unknown> {
    const browser = await pptr.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless
    });
    const page = await browser.newPage();

    return new Promise(async (resolve) => {
      try {
        page.on('response', async (response) => {
          if (response.url().endsWith(path)) {
            try {
              const data = await response.json();
              resolve(data);
            } catch {}
          }
        });

        await page.goto('https://covid.saude.gov.br');
      } catch {
        resolve(null);
      }
    });
}

export default async (req: NowRequest, res: NowResponse) => {
  const { query: { govApi } } = req;

  const res204 = () => res.status(204).send({});

  if (Array.isArray(govApi)) return res204();
  if (!apisConhecidas.includes(govApi)) return res204();

  try {
    const data = await gov(govApi);
    if (data) res.send(data);
    else res204();
  } catch (e) {
    console.error(e);
    res.status(500).send({});
  }
}
