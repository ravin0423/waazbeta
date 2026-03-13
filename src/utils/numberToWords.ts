const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertGroup(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertGroup(n % 100) : '');
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero Only';
  
  const isNegative = num < 0;
  num = Math.abs(num);
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  // Indian numbering: Crore, Lakh, Thousand, Hundred
  let result = '';
  
  if (rupees >= 10000000) {
    result += convertGroup(Math.floor(rupees / 10000000)) + ' Crore ';
    num = rupees % 10000000;
  } else {
    num = rupees;
  }
  
  if (num >= 100000) {
    result += convertGroup(Math.floor(num / 100000)) + ' Lakh ';
    num = num % 100000;
  }
  
  if (num >= 1000) {
    result += convertGroup(Math.floor(num / 1000)) + ' Thousand ';
    num = num % 1000;
  }
  
  if (num > 0) {
    result += convertGroup(num);
  }
  
  result = (isNegative ? 'Minus ' : '') + 'Rupees ' + result.trim();
  
  if (paise > 0) {
    result += ' and ' + convertGroup(paise) + ' Paise';
  }
  
  return result + ' Only';
}
