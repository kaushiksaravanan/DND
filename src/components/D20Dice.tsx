import { useState, useEffect, useCallback } from 'react';
import { DiceRoll, getDiceResultType } from '../types/game';

interface D20DiceProps {
    onRollComplete?: (roll: DiceRoll) => void;
    disabled?: boolean;
    autoRoll?: boolean;
}

export function D20Dice({ onRollComplete, disabled = false, autoRoll = false }: D20DiceProps) {
    const [isRolling, setIsRolling] = useState(false);
    const [currentValue, setCurrentValue] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);

    const rollDice = useCallback(() => {
        if (isRolling || disabled) return;

        setIsRolling(true);
        setShowResult(false);
        setCurrentValue(null);

        // Animate through random numbers
        let rollCount = 0;
        const maxRolls = 15;
        const interval = setInterval(() => {
            setCurrentValue(Math.floor(Math.random() * 20) + 1);
            rollCount++;

            if (rollCount >= maxRolls) {
                clearInterval(interval);

                // Final roll
                const finalValue = Math.floor(Math.random() * 20) + 1;
                setCurrentValue(finalValue);
                setIsRolling(false);
                setShowResult(true);

                const roll: DiceRoll = {
                    value: finalValue,
                    type: getDiceResultType(finalValue),
                    timestamp: Date.now(),
                };

                setTimeout(() => {
                    onRollComplete?.(roll);
                }, 1000);
            }
        }, 80);
    }, [isRolling, disabled, onRollComplete]);

    useEffect(() => {
        if (autoRoll && !isRolling && currentValue === null) {
            const timer = setTimeout(rollDice, 500);
            return () => clearTimeout(timer);
        }
    }, [autoRoll, isRolling, currentValue, rollDice]);

    const getResultColor = () => {
        if (!currentValue || !showResult) return '';
        if (currentValue === 1) return 'dice-critical-fail';
        if (currentValue <= 7) return 'dice-fail';
        if (currentValue <= 14) return 'dice-partial';
        if (currentValue <= 19) return 'dice-success';
        return 'dice-critical-success';
    };

    const getResultLabel = () => {
        if (!currentValue || !showResult) return '';
        if (currentValue === 1) return 'Critical Fail!';
        if (currentValue <= 7) return 'Failed';
        if (currentValue <= 14) return 'Partial Success';
        if (currentValue <= 19) return 'Success!';
        return 'CRITICAL SUCCESS!';
    };

    return (
        <div className="d20-container">
            <button
                onClick={rollDice}
                disabled={disabled || isRolling}
                className={`d20-dice ${isRolling ? 'd20-rolling' : ''} ${getResultColor()} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <div className="d20-face">
                    <span className="d20-value">
                        {currentValue ?? '?'}
                    </span>
                </div>
            </button>

            {showResult && currentValue && (
                <div className={`d20-result ${getResultColor()}`}>
                    <span className="d20-result-label">{getResultLabel()}</span>
                </div>
            )}

            {!showResult && !isRolling && !disabled && (
                <p className="d20-hint">Click to roll</p>
            )}

            {isRolling && (
                <p className="d20-hint animate-pulse">Rolling...</p>
            )}
        </div>
    );
}
