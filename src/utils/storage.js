export const StorageKeys = {
    USER_EMAIL: 'userEmail',
    IS_LOGGED_IN: 'isLoggedIn',
    BUSINESS_PLAN: 'businessPlan',
    FORECAST_DATA: 'forecastData',
    ACTUALS_DATA: 'actualsData',
    LEARNING_OUTCOMES: 'learningOutcomes'
};

export const saveToStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
};

export const getFromStorage = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from storage:', error);
        return defaultValue;
    }
};

export const clearStorage = () => {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
    }
};
