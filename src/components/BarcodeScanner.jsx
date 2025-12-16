import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { X, Camera } from 'lucide-react';
import { AppButton } from './index';

const BarcodeScanner = ({ onScan, onClose }) => {
    const videoRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const readerRef = useRef(null);

    useEffect(() => {
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const startScanning = async () => {
            try {
                setIsScanning(true);
                setError('');

                // Get video devices
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');

                if (videoDevices.length === 0) {
                    setError('No camera found on this device');
                    return;
                }

                // Prefer back camera on mobile
                const backCamera = videoDevices.find(device => 
                    device.label.toLowerCase().includes('back') || 
                    device.label.toLowerCase().includes('rear')
                );
                const selectedDevice = backCamera || videoDevices[0];

                // Start decoding
                await reader.decodeFromVideoDevice(
                    selectedDevice.deviceId,
                    videoRef.current,
                    (result) => {
                        if (result) {
                            // Successfully scanned barcode
                            const barcodeText = result.getText();
                            onScan(barcodeText);
                            // Stop scanning after successful scan
                            reader.reset();
                        }
                    }
                );
            } catch (err) {
                console.error('Camera error:', err);
                setError('Unable to access camera. Please check permissions.');
                setIsScanning(false);
            }
        };

        startScanning();

        // Cleanup on unmount
        return () => {
            if (readerRef.current) {
                readerRef.current.reset();
            }
        };
    }, [onScan]);

    const handleClose = () => {
        if (readerRef.current) {
            readerRef.current.reset();
        }
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Header */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: 'var(--spacing-lg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.8)',
                zIndex: 1001
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Camera size={24} color="#fff" />
                    <h2 style={{ color: '#fff', margin: 0, fontSize: '1.25rem' }}>Scan Barcode</h2>
                </div>
                <button
                    onClick={handleClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: '0.5rem'
                    }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Video Preview */}
            <div style={{
                width: '100%',
                maxWidth: '600px',
                aspectRatio: '4/3',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 'var(--radius-md)',
                background: '#000'
            }}>
                <video
                    ref={videoRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
                
                {/* Scanning overlay */}
                {isScanning && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        height: '60%',
                        border: '2px solid var(--accent-success)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '100%',
                            height: '2px',
                            background: 'var(--accent-success)',
                            animation: 'scan 2s ease-in-out infinite'
                        }} />
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div style={{
                marginTop: 'var(--spacing-lg)',
                textAlign: 'center',
                color: '#fff',
                maxWidth: '400px',
                padding: '0 var(--spacing-lg)'
            }}>
                {error ? (
                    <div style={{ color: 'var(--accent-danger)', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                ) : (
                    <>
                        <p style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '1rem' }}>
                            Position barcode within the frame
                        </p>
                        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>
                            Scanner will automatically detect and add the product
                        </p>
                    </>
                )}
            </div>

            <style>{`
                @keyframes scan {
                    0%, 100% { top: 10%; }
                    50% { top: 90%; }
                }
            `}</style>
        </div>
    );
};

export default BarcodeScanner;
