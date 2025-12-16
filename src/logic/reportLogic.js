import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Re-using filter logic for getDaily/Weekly/Monthly
export const filterSalesByDate = (sales, filterType, startDate, endDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight today

    return sales
        .filter(s => !s.voided)
        .filter(sale => {
        const saleDate = new Date(sale.date);

        switch (filterType) {
            case 'daily':
                return saleDate >= today;
            case 'weekly': {
                const oneWeekAgo = new Date(today);
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                return saleDate >= oneWeekAgo;
            }
            case 'monthly': {
                const oneMonthAgo = new Date(today);
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                return saleDate >= oneMonthAgo;
            }
            case 'custom': {
                if (!startDate || !endDate) return true;
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return saleDate >= start && saleDate <= end;
            }
            default:
                return true;
        }
    });
};

export const getDailySales = (sales) => filterSalesByDate(sales, 'daily');
export const getWeeklySales = (sales) => filterSalesByDate(sales, 'weekly');
export const getMonthlySales = (sales) => filterSalesByDate(sales, 'monthly');

export const calculateTotals = (sales) => {
    const valid = sales.filter(s => !s.voided);
    const totalSales = valid.reduce((sum, s) => sum + s.total_price, 0);
    const totalProfit = valid.reduce((sum, s) => sum + s.profit, 0);
    const transactionCount = valid.length;
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
    // Determine if sales are flat or nested (transactions)
    // New structure has 'items' array
    const allItems = sales.filter(s => !s.voided).flatMap(sale => sale.items || [sale]);

    const salesByProduct = allItems.reduce((acc, item) => {
        // Handle undefined or missing product_id/productId
        const pId = item.productId || item.product_id;
        acc[pId] = (acc[pId] || 0) + item.quantity;
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
// Exports
export const exportToPDF = (stats, sales, filterType) => {
    const doc = new jsPDF();

    doc.text(`Sales Report - ${filterType.toUpperCase()}`, 14, 20);
    doc.text(`Total Sales: $${stats.totalSales.toFixed(2)}`, 14, 30);
    doc.text(`Total Profit: $${stats.totalProfit.toFixed(2)}`, 14, 40);

    const tableData = [];

    // Flatten for the table, but maybe group by transaction?
    // Let's list items individually for detailed report
    sales.forEach(s => {
        const dateStr = new Date(s.date).toLocaleDateString();
        // Check if new structure
        if (s.items) {
            s.items.forEach(item => {
                tableData.push([
                    dateStr,
                    s.payment_method,
                    item.name || 'Item',
                    item.quantity,
                    `$${item.total.toFixed(2)}`
                ]);
            });
        } else {
            // Fallback for old data
            tableData.push([
                dateStr,
                s.payment_method,
                'Product', // Name might not be in old record
                s.quantity,
                `$${s.total_price.toFixed(2)}`
            ]);
        }
    });

    autoTable(doc, {
        head: [['Date', 'Payment', 'Item', 'Qty', 'Total']],
        body: tableData,
        startY: 50,
    });

    doc.save(`sales-report-${filterType}.pdf`);
};

export const exportToCSV = (sales, filterType) => {
    let csvRows = ["Date,Payment Method,Item,Quantity,Total Price,Profit"];

    sales.forEach(s => {
        const dateStr = new Date(s.date).toLocaleDateString();
        if (s.items) {
            s.items.forEach(item => {
                csvRows.push(`${dateStr},${s.payment_method},"${item.name}",${item.quantity},${item.total},${item.profit}`);
            });
        } else {
            csvRows.push(`${dateStr},${s.payment_method},Product,${s.quantity},${s.total_price},${s.profit}`);
        }
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales-report-${filterType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
