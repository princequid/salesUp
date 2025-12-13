import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Re-using filter logic for getDaily/Weekly/Monthly
export const filterSalesByDate = (sales, filterType, startDate, endDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight today

    return sales.filter(sale => {
        const saleDate = new Date(sale.date);

        switch (filterType) {
            case 'daily':
                return saleDate >= today;
            case 'weekly':
                const oneWeekAgo = new Date(today);
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                return saleDate >= oneWeekAgo;
            case 'monthly':
                const oneMonthAgo = new Date(today);
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                return saleDate >= oneMonthAgo;
            case 'custom':
                if (!startDate || !endDate) return true;
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return saleDate >= start && saleDate <= end;
            default:
                return true;
        }
    });
};

export const getDailySales = (sales) => filterSalesByDate(sales, 'daily');
export const getWeeklySales = (sales) => filterSalesByDate(sales, 'weekly');
export const getMonthlySales = (sales) => filterSalesByDate(sales, 'monthly');

export const calculateTotals = (sales) => {
    const totalSales = sales.reduce((sum, s) => sum + s.total_price, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
    const transactionCount = sales.length;
    return { totalSales, totalProfit, transactionCount };
};


export const calculateDailyStats = (sales, products, lowStockThreshold) => {
    const dailySales = getDailySales(sales);
    const { totalSales, totalProfit } = calculateTotals(dailySales);

    // Count low stock items
    const lowStockCount = products.filter(p => p.quantity <= lowStockThreshold).length;

    return {
        totalSales,
        totalProfit,
        lowStockCount
    };
};

export const getTopSellingItems = (sales, products) => {
    const salesByProduct = sales.reduce((acc, sale) => {
        acc[sale.product_id] = (acc[sale.product_id] || 0) + sale.quantity;
        return acc;
    }, {});

    const sorted = Object.entries(salesByProduct)
        .map(([id, quantity]) => {
            const product = products.find(p => p.id === id);
            return {
                name: product ? product.name : 'Unknown Product',
                quantity,
                id
            };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5); // Top 5

    return sorted;
};

// Exports
export const exportToPDF = (stats, sales, filterType) => {
    const doc = new jsPDF();

    doc.text(`Sales Report - ${filterType.toUpperCase()}`, 14, 20);
    doc.text(`Total Sales: $${stats.totalSales.toFixed(2)}`, 14, 30);
    doc.text(`Total Profit: $${stats.totalProfit.toFixed(2)}`, 14, 40);

    const tableData = sales.map(s => [
        new Date(s.date).toLocaleDateString(),
        s.payment_method,
        s.quantity,
        `$${s.total_price.toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [['Date', 'Payment', 'Qty', 'Total']],
        body: tableData,
        startY: 50,
    });

    doc.save(`sales-report-${filterType}.pdf`);
};

export const exportToCSV = (sales, filterType) => {
    const csvContent = "data:text/csv;charset=utf-8,"
        + "Date,Payment Method,Quantity,Total Price,Profit\n"
        + sales.map(s => `${new Date(s.date).toLocaleDateString()},${s.payment_method},${s.quantity},${s.total_price},${s.profit}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales-report-${filterType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
