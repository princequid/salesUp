import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, BarChart3, Store, ArrowRight, X } from 'lucide-react';
import { AppButton } from '../../components';

const WelcomeScreen = ({ onGetStarted, onRegister, onLogin }) => {
    const [step, setStep] = useState(0);
    const [isSkipped, setIsSkipped] = useState(false);

    useEffect(() => {
        if (isSkipped) return;

        const timers = [];

        // Step 0 -> 1: Logo appears (after 500ms initial delay)
        timers.push(setTimeout(() => setStep(1), 500));

        // Step 1 -> 2: Title appears (1.5s after logo = 2000ms total)
        timers.push(setTimeout(() => setStep(2), 2000));

        // Step 2 -> 3: Description appears (1.5s after title = 3500ms total)
        timers.push(setTimeout(() => setStep(3), 3500));

        // Step 3 -> 4: Feature 1 appears (1.5s after description = 5000ms total)
        timers.push(setTimeout(() => setStep(4), 5000));

        // Step 4 -> 5: Feature 2 appears (1.5s after feature 1 = 6500ms total)
        timers.push(setTimeout(() => setStep(5), 6500));

        // Step 5 -> 6: Feature 3 appears (1.5s after feature 2 = 8000ms total)
        timers.push(setTimeout(() => setStep(6), 8000));

        // Step 6 -> 7: Feature 4 appears (1.5s after feature 3 = 9500ms total)
        timers.push(setTimeout(() => setStep(7), 9500));

        // Step 7 -> 8: Buttons appear (1.5s after feature 4 = 11000ms total)
        timers.push(setTimeout(() => setStep(8), 11000));

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [isSkipped]);

    const handleSkip = () => {
        setIsSkipped(true);
        setStep(8); // Jump to final step
    };

    return (
        <div className="welcome-overlay">
            {/* Skip Button */}
            {step < 8 && (
                <button
                    className="welcome-skip-button"
                    onClick={handleSkip}
                    aria-label="Skip intro"
                >
                    <X size={20} />
                    Skip
                </button>
            )}

            <div className="welcome-container">
                {/* Step 1: Logo */}
                {step >= 1 && (
                    <div className={`welcome-step ${step >= 1 ? 'welcome-step-visible' : ''}`}>
                        <div className="welcome-logo welcome-logo-animated">
                            <span className="welcome-logo-icon">▲</span>
                        </div>
                    </div>
                )}

                {/* Step 2: Title */}
                {step >= 2 && (
                    <div className={`welcome-step ${step >= 2 ? 'welcome-step-visible' : ''}`}>
                        <h1 className="welcome-title welcome-title-animated">
                            <span className="welcome-title-sales">Sales</span>
                            <span className="welcome-title-up">UP</span>
                        </h1>
                        <p className="welcome-tagline welcome-tagline-animated">
                            Your Smart POS Solution for Modern Retail
                        </p>
                    </div>
                )}

                {/* Step 3: Description */}
                {step >= 3 && (
                    <div className={`welcome-step ${step >= 3 ? 'welcome-step-visible' : ''}`}>
                        <p className="welcome-description welcome-description-animated">
                            Manage inventory, track sales, generate reports, and grow your business—all in one powerful platform.
                        </p>
                    </div>
                )}

                {/* Features Grid Container */}
                <div className="welcome-features">
                    {/* Step 4: Feature 1 - Inventory */}
                    {step >= 4 && (
                        <div className={`welcome-feature welcome-feature-inventory ${step >= 4 ? 'welcome-feature-visible' : ''}`}>
                            <div className="welcome-feature-icon">
                                <Package size={24} />
                            </div>
                            <h3 className="welcome-feature-title">Inventory Management</h3>
                            <p className="welcome-feature-desc">Track stock levels and get low-stock alerts</p>
                        </div>
                    )}

                    {/* Step 5: Feature 2 - Sales */}
                    {step >= 5 && (
                        <div className={`welcome-feature welcome-feature-sales ${step >= 5 ? 'welcome-feature-visible' : ''}`}>
                            <div className="welcome-feature-icon">
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="welcome-feature-title">Sales Tracking</h3>
                            <p className="welcome-feature-desc">Record transactions and monitor revenue</p>
                        </div>
                    )}

                    {/* Step 6: Feature 3 - Analytics */}
                    {step >= 6 && (
                        <div className={`welcome-feature welcome-feature-analytics ${step >= 6 ? 'welcome-feature-visible' : ''}`}>
                            <div className="welcome-feature-icon">
                                <BarChart3 size={24} />
                            </div>
                            <h3 className="welcome-feature-title">Analytics & Reports</h3>
                            <p className="welcome-feature-desc">Gain insights with detailed reports</p>
                        </div>
                    )}

                    {/* Step 7: Feature 4 - Multi-Store */}
                    {step >= 7 && (
                        <div className={`welcome-feature welcome-feature-multistore ${step >= 7 ? 'welcome-feature-visible' : ''}`}>
                            <div className="welcome-feature-icon">
                                <Store size={24} />
                            </div>
                            <h3 className="welcome-feature-title">Multi-Store Support</h3>
                            <p className="welcome-feature-desc">Manage multiple locations seamlessly</p>
                        </div>
                    )}
                </div>

                {/* Step 8: Action Buttons */}
                {step >= 8 && (
                    <div className={`welcome-actions ${step >= 8 ? 'welcome-actions-visible' : ''}`}>
                        <AppButton
                            onClick={onGetStarted}
                            style={{
                                fontSize: '1rem',
                                padding: '0.875rem 2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            Get Started
                            <ArrowRight size={20} />
                        </AppButton>
                        <div className="welcome-secondary-actions">
                            <button
                                className="welcome-link-button"
                                onClick={onRegister}
                            >
                                Register Business
                            </button>
                            <button
                                className="welcome-link-button"
                                onClick={onLogin}
                            >
                                Login
                            </button>
                        </div>
                        <p className="welcome-footer">
                            Start exploring immediately or create an account to unlock all features
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeScreen;
