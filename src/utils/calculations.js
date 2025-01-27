export const calculateTax = (amount, taxRate) => {
    return amount > 0 ? amount * (taxRate / 100) : 0;
};

export const calculateMargin = (revenue, cost) => {
    return revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
};

export const calculateMonthlyDistribution = (total, startMonth, endMonth) => {
    const months = getActiveMonths(startMonth, endMonth);
    const monthlyAmount = Math.floor(total / months.length);
    return Array(12).fill(0).map((_, month) => 
        months.includes(month) ? monthlyAmount : 0
    );
};

export const getActiveMonths = (start, end) => {
    const months = [];
    if (end >= start) {
        for (let i = start; i <= end; i++) months.push(i);
    } else {
        for (let i = start; i < 12; i++) months.push(i);
        for (let i = 0; i <= end; i++) months.push(i);
    }
    return months;
};
