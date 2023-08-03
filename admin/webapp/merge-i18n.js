const fs = require('fs');

const enCommonData = JSON.parse(fs.readFileSync('websrc/assets/i18n/en-common.json'));
const enPartnerData = JSON.parse(fs.readFileSync('websrc/assets/i18n/en-partner.json'));
const zhcnCommonData = JSON.parse(fs.readFileSync('websrc/assets/i18n/zh_cn-common.json'));
const zhcnPartnerData = JSON.parse(fs.readFileSync('websrc/assets/i18n/zh_cn-partner.json'));

const mergedEnData = { ...enCommonData, ...enPartnerData };
const mergedZhcnData = { ...zhcnCommonData, ...zhcnPartnerData };

fs.writeFileSync('websrc/assets/i18n/en.json', JSON.stringify(mergedEnData, null, 2));
fs.writeFileSync('websrc/assets/i18n/zh_cn.json', JSON.stringify(mergedZhcnData, null, 2));
