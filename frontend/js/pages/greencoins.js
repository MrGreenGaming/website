const mainElement = document.querySelector('main');
if (mainElement.classList.contains('buy')) {
    const euroElement = mainElement.querySelector('input[name=amount]');
    const calculateExchangeAmount = () => {
        const gcElement = mainElement.querySelector('input[name=greencoins]');
        const gcExchangeRate = gcElement.dataset.exchangeRate;

        const amount = parseFloat(euroElement.value);

        const minAmount = parseFloat(euroElement.getAttribute('min'));
        const maxAmount = parseFloat(euroElement.getAttribute('max'));


        console.log(amount, euroElement.getAttribute('max'), parseFloat(euroElement.getAttribute('min')), parseFloat(euroElement.getAttribute('max')));
        if (isNaN(amount))
            gcElement.value = 'Invalid amount entered';
        else if (amount < minAmount)
            gcElement.value = `Below minimum of €${minAmount.toFixed(2)}`;
        else if (amount > maxAmount)
            gcElement.value = `Above maximum of €${maxAmount.toFixed(2)}`;
        else {
            const amountCents = (Math.floor(amount * 100) / 100) * gcExchangeRate;
            gcElement.value = `${amountCents.toLocaleString()} GC`;
        }
    };
    euroElement.addEventListener('input', calculateExchangeAmount);
    calculateExchangeAmount();
}