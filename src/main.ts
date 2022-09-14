import puppeteer from 'puppeteer';

async function getPartnerCode (partnerUsername: string, partnerPassword: string) {
    const browser = await puppeteer.launch({ headless: false, slowMo: 0, devtools: true });
    // partnerCode part
    const page = await browser.newPage();
    await page.setViewport({
        width: 1200,
        height: 800,
    });
    await page.goto('https://zjuam.zju.edu.cn/cas/login?service=http://www.tyys.zju.edu.cn/venue-server/sso/manageLogin');
    await page.$eval('#username', (el, user) => (el as HTMLInputElement).value = user, partnerUsername);
    await page.$eval('#password', (el, pass) => (el as HTMLInputElement).value = pass, partnerPassword);
    await Promise.all([
        page.waitForNavigation(),
        page.click('#dl'),
    ]);
    await Promise.all([
        page.waitForNavigation(),
        page.click('body > div.fullHeight > div > div.siderWrap > div > div.ivu-layout-sider-children > div.left-menu > ul > div.fullHeight.scroll > li:nth-child(4)') // 同伴管理
    ]);
    await page.waitForTimeout(500);
    await page.click('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.pageHeader > div:nth-child(2) > div > div > div.pageHeaderRight > div:nth-child(1) > button'); // 我的同伴码
    await page.waitForTimeout(500);
    const partnerCode: string = await page.$eval('body > div:nth-child(16) > div.ivu-modal-wrap > div > div > div.ivu-modal-body > div', el => (el.textContent as string).replace(/\s/g, ''));
    await browser.close();
    return partnerCode;
}

// @username: string, 用来预约的账户名
// @password: string, 用来预约的密码
// @partnerUsername: string, 第一个同伴的账户名
// @partnerPassword: string, 第一个同伴的密码
// @acceptableTimes: string[][]，可接受的时间段，第一维是星期几，第二维是实际的时间，如['07:30-08:30', '08:30-09:30']
async function main (username: string, password: string, partnerUsername: string, partnerPassword: string, acceptableTimes: string[][]) {
    const partnerCode = await getPartnerCode(partnerUsername, partnerPassword);

    // Main part
    const browser = await puppeteer.launch({ headless: false, slowMo: 0, devtools: true });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1200,
        height: 800,
    });
    await page.goto('https://zjuam.zju.edu.cn/cas/login?service=http://www.tyys.zju.edu.cn/venue-server/sso/manageLogin');
    await page.$eval('#username', (el, user) => (el as HTMLInputElement).value = user, username);
    await page.$eval('#password', (el, pass) => (el as HTMLInputElement).value = pass, password);
    await Promise.all([
        page.waitForNavigation(),
        page.click('#dl'),
    ]);
    await Promise.all([
        page.waitForNavigation(),
        page.click('body > div.fullHeight > div > div.siderWrap > div > div.ivu-layout-sider-children > div.left-menu > ul > div.fullHeight.scroll > li:nth-child(2)')
    ]);
    await page.waitForTimeout(500);
    await page.click('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservationStep1 > form > div:nth-child(1) > div > button:nth-child(3)'); // 下一天
    await page.click('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservationStep1 > form > div:nth-child(1) > div > button:nth-child(3)'); // 下一天
    await page.waitForSelector('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservationStep1 > form > div:nth-child(2) > div > div > label:nth-child(3)'); // TODO: change this from 3 to 2
    await page.click('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservationStep1 > form > div:nth-child(2) > div > div > label:nth-child(3)'); // 玉泉校区
    await page.click('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservationStep1 > form > div:nth-child(4) > div > div > label'); // 羽毛球馆


    // Now we should be getting a table of vacancy.
    await page.waitForSelector('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservationStep1 > div:nth-child(3) > div.tableWrap > div > div > div > div > div > table > tbody');

    await page.waitForTimeout(500);

    const selectedBlock = await page.$eval('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservationStep1 > div:nth-child(3) > div.tableWrap > div > div > div > div > div > table > tbody', (el, times) => {
        let selected = '';
        const date = new Date();
        date.setDate(date.getDate() + 2);
        const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
        console.log(dayOfWeek);
        console.log(times[dayOfWeek]);
        el.childNodes.forEach((row, rowId) => {
            // Each element here is a row of the table. The first element is the time.
            if (selected) return;
            if (rowId === el.childElementCount - 1) return; // The last element is another table title.
            const time = (row.textContent as string).trim();
            console.log(time);
            if (!times[dayOfWeek].includes(time)) return;
            console.log(`time ${time} is acceptable`);
            row.childNodes.forEach((block, blockKey) => {
                if (selected) return;
                if (blockKey === 0) return; // The first element is the time.
                if ((block.firstChild as Element).className === 'reserveBlock position free') {
                    console.log(blockKey);
                    selected = `body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservationStep1 > div:nth-child(3) > div.tableWrap > div > div > div > div > div > table > tbody > tr:nth-child(${rowId + 1}) > td:nth-child(${blockKey + 1})`;
                }
            });
        });
        return selected;
    }, acceptableTimes);

    let retCode: number;

    if (selectedBlock) {
        await page.click(selectedBlock);
        await page.click('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservationStep1 > div:nth-child(4) > label'); // 已阅读并同意
        await page.click('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservationStep1 > div.checkStep > div > button'); // 确认预约
        await page.waitForSelector('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservation-step-two > form > div > div.ivu-form-item > div > div > label > span.ivu-checkbox > input');
        await page.waitForTimeout(500);
        await page.click('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservation-step-two > form > div > div.ivu-form-item > div > div > label > span.ivu-checkbox > input'); // 选择同伴
        await page.waitForTimeout(500);
        await page.$eval('body > div:nth-child(15) > div.ivu-modal-wrap > div > div > div.ivu-modal-body > form > div > div > div.ivu-input-wrapper.ivu-input-wrapper-default.ivu-input-type > div > input', (el, code) => {
            (el as HTMLInputElement).value = code;
            el.dispatchEvent(new Event('input'));
        }, partnerCode); // 同伴码
        await page.click('body > div:nth-child(15) > div.ivu-modal-wrap > div > div > div.ivu-modal-footer > footer > button.ivu-btn.ivu-btn-primary'); // 确认
        page.waitForTimeout(500);
        await page.$eval('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservation-step-two > form > div > div.ivu-col.ivu-col-span-sm-12 > div > div > div > div > input', el => (el as HTMLInputElement).value = '15377799999'); // 手机号
        await page.waitForTimeout(500);
        await page.click('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div.reservation-step-two > div.checkStep > div > button'); // 提交订单
        await page.waitForTimeout(500);
        await page.click('body > div.fullHeight > div > div.ivu-layout > div.rightContent.ivu-layout > div > div.ivu-card.ivu-card-bordered.ivu-card-dis-hover > div > div > div:nth-child(3) > div.payHandle > div:nth-child(2) > button'); // 确认支付
        // Done!
        retCode = 0;
    } else {
        retCode = 1;
    }

    await browser.close();
    return retCode;
}

while (await main('', '', '', '', [['07:30-08:30'], [], [], [], [], ['07:30-08:30'], ['07:30-08:30']]) !== 0);