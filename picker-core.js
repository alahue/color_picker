/**
 * Color Picker Core - Modified Elo Rating System
 * 
 * Created by: Austin LaHue & Frederick Gyasi
 */

'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ColorPickerCore = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    // ============================================
    // COLOR SPACE UTILITIES
    // ============================================

    function generatePerceptuallyDistinctColors(count) {
        const colors = [];
        const goldenRatioConjugate = 0.618033988749895;
        let hue = Math.random();
        
        const lightnessLevels = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
        const saturationLevels = [0.4, 0.6, 0.8, 1.0];
        
        for (let i = 0; i < count; i++) {
            hue += goldenRatioConjugate;
            hue %= 1;
            
            const satIndex = i % saturationLevels.length;
            const lightIndex = Math.floor(i / saturationLevels.length) % lightnessLevels.length;
            
            const h = Math.floor(hue * 360);
            const s = Math.floor(saturationLevels[satIndex] * 100);
            const l = Math.floor(lightnessLevels[lightIndex] * 100);
            
            const hex = hslToHex(h, s, l);
            
            colors.push({
                id: `color_${i}`,
                name: `Color ${i + 1}`,
                hex: hex,
                hsl: { h, s, l },
                rgb: hslToRgb(h, s, l),
                eloRating: 1500,
                comparisons: 0,
                wins: 0,
                losses: 0
            });
        }
        
        return colors;
    }

    function hslToRgb(h, s, l) {
        h = h / 360;
        s = s / 100;
        l = l / 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    function hslToHex(h, s, l) {
        const rgb = hslToRgb(h, s, l);
        const toHex = (n) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
    }

    function simulateColorBlindness(rgb, type) {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;
        
        let matrix;
        
        switch(type) {
            case 'protanopia':
                matrix = [
                    [0.567, 0.433, 0],
                    [0.558, 0.442, 0],
                    [0, 0.242, 0.758]
                ];
                break;
            case 'deuteranopia':
                matrix = [
                    [0.625, 0.375, 0],
                    [0.7, 0.3, 0],
                    [0, 0.3, 0.7]
                ];
                break;
            case 'tritanopia':
                matrix = [
                    [0.95, 0.05, 0],
                    [0, 0.433, 0.567],
                    [0, 0.475, 0.525]
                ];
                break;
            default:
                return rgb;
        }
        
        return {
            r: Math.round((matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b) * 255),
            g: Math.round((matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b) * 255),
            b: Math.round((matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b) * 255)
        };
    }

    function getPatternForColor(index) {
        const patterns = [
            'solid', 'dots', 'stripes', 'diagonal', 'crosshatch', 
            'waves', 'checkers', 'grid', 'circles', 'triangles'
        ];
        return patterns[index % patterns.length];
    }

    // ============================================
    // ELO RATING SYSTEM
    // ============================================

    function calculateExpectedScore(ratingA, ratingB) {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    }

    function updateEloRatings(winner, loser, isDraw = false) {
        const kFactor = Math.max(32, 64 - winner.comparisons * 2);
        
        const expectedWin = calculateExpectedScore(winner.eloRating, loser.eloRating);
        const expectedLose = calculateExpectedScore(loser.eloRating, winner.eloRating);
        
        if (isDraw) {
            winner.eloRating += kFactor * (0.5 - expectedWin);
            loser.eloRating += kFactor * (0.5 - expectedLose);
        } else {
            winner.eloRating += kFactor * (1 - expectedWin);
            loser.eloRating += kFactor * (0 - expectedLose);
            winner.wins++;
            loser.losses++;
        }
        
        winner.comparisons++;
        loser.comparisons++;
    }

    // ============================================
    // PICKER STATE WITH ELO
    // ============================================

    function EloPickerState(options) {
        options = options || {};
        
        if (!options.items && !options.generateColors) {
            console.error("No items specified for EloPickerState!");
            return;
        }
        
        this.options = options;
        this.maxComparisons = options.maxComparisons || 20;
        this.analytics = {
            sessionStartTime: Date.now(),
            totalComparisons: 0,
            sessionComparisons: 0,
            passes: 0,
            picks: 0,
            averageDecisionTime: 0,
            decisionTimes: []
        };
        this.lastActionTime = Date.now();
        this.colors = [];
        this.eliminated = [];
        this.favorites = [];
        this.evaluating = null;
        this.settings = {};
        this.sessionComplete = false;
    }

    EloPickerState.prototype.getState = function() {
        return {
            colors: this.colors.map(c => ({
                id: c.id,
                eloRating: c.eloRating,
                comparisons: c.comparisons,
                wins: c.wins,
                losses: c.losses
            })),
            evaluating: this.evaluating ? this.evaluating.map(c => c.id) : [],
            favorites: this.favorites.map(c => c.id),
            eliminated: this.eliminated.map(c => c.id),
            settings: JSON.parse(JSON.stringify(this.settings)),
            analytics: JSON.parse(JSON.stringify(this.analytics)),
            sessionComplete: this.sessionComplete
        };
    };

    EloPickerState.prototype.initialize = function(settings) {
        this.settings = settings || this.options.defaultSettings || {
            batchSize: 10
        };
        
        if (this.options.generateColors !== false) {
            this.colors = generatePerceptuallyDistinctColors(this.options.colorCount || 200);
        } else {
            this.colors = (this.options.items || []).map((item, index) => ({
                ...item,
                eloRating: item.eloRating || 1500,
                comparisons: item.comparisons || 0,
                wins: item.wins || 0,
                losses: item.losses || 0
            }));
        }
        
        this.eliminated = [];
        this.favorites = [];
        this.evaluating = null;
        this.sessionComplete = false;
        
        this.analytics.sessionStartTime = Date.now();
        this.analytics.sessionComparisons = 0;
        
        this.nextBatch();
    };

    EloPickerState.prototype.restoreState = function(state) {
        this.settings = state.settings || this.options.defaultSettings || {
            batchSize: 10
        };
        
        const colorMap = new Map();
        if (this.options.generateColors !== false) {
            this.colors = generatePerceptuallyDistinctColors(this.options.colorCount || 200);
        } else {
            this.colors = this.options.items || [];
        }
        
        this.colors.forEach(c => colorMap.set(c.id, c));
        
        if (state.colors) {
            state.colors.forEach(savedColor => {
                const color = colorMap.get(savedColor.id);
                if (color) {
                    color.eloRating = savedColor.eloRating;
                    color.comparisons = savedColor.comparisons;
                    color.wins = savedColor.wins;
                    color.losses = savedColor.losses;
                }
            });
        }
        
        this.evaluating = state.evaluating ? state.evaluating.map(id => colorMap.get(id)).filter(c => c) : null;
        this.favorites = state.favorites ? state.favorites.map(id => colorMap.get(id)).filter(c => c) : [];
        this.eliminated = state.eliminated ? state.eliminated.map(id => colorMap.get(id)).filter(c => c) : [];
        this.analytics = state.analytics || this.analytics;
        this.sessionComplete = state.sessionComplete || false;
        
        if (this.sessionComplete || this.analytics.sessionComparisons >= this.maxComparisons) {
            this.evaluating = null;
            this.sessionComplete = true;
        }
    };

    EloPickerState.prototype.nextBatch = function() {
        if (this.sessionComplete || this.analytics.sessionComparisons >= this.maxComparisons) {
            this.evaluating = null;
            this.sessionComplete = true;
            return;
        }
        
        const available = this.colors.filter(c => 
            !this.eliminated.includes(c) && 
            !this.favorites.includes(c)
        );
        
        if (available.length === 0) {
            this.evaluating = null;
            this.sessionComplete = true;
            return;
        }
        
        if (this.analytics.sessionComparisons >= 10) {
            const sortedByRating = [...available].sort((a, b) => b.eloRating - a.eloRating);
            const threshold = sortedByRating[Math.floor(sortedByRating.length * 0.75)]?.eloRating || 1500;
            
            available.forEach(c => {
                if (c.comparisons >= 8 && c.eloRating < threshold - 200) {
                    this.eliminated.push(c);
                }
            });
        }
        
        const batchSize = Math.min(10, available.length);
        
        const batch = this.selectDiverseBatch(available.filter(c => !this.eliminated.includes(c)), batchSize);
        this.evaluating = batch;
        this.lastActionTime = Date.now();
    };

    EloPickerState.prototype.selectDiverseBatch = function(available, size) {
        if (available.length <= size) return available;

        // Group colors by hue ranges (similar colors together)
        const hueGroups = this.groupByHue(available);

        const batch = [];
        const usedGroups = new Set();

        // First, add some high-rated colors (but not always the top one)
        // Give higher-rated colors more chance but not guaranteed inclusion
        const sortedByRating = [...available].sort((a, b) => b.eloRating - a.eloRating);

        // Skip the very top colors sometimes to avoid them appearing every batch
        const skipTop = Math.random() < 0.6; // 60% chance to skip top colors
        const startIndex = skipTop ? Math.floor(Math.random() * 3) + 1 : 0;

        // Add 2-3 higher-rated colors with some randomness
        const highRatedCount = 2 + Math.floor(Math.random() * 2);
        for (let i = startIndex; i < sortedByRating.length && batch.length < highRatedCount; i++) {
            const color = sortedByRating[i];
            // 70% chance to include each high-rated color (not guaranteed)
            if (Math.random() < 0.7) {
                batch.push(color);
                usedGroups.add(this.getHueGroup(color.hsl.h));
            }
        }

        // Fill rest with colors from diverse hue groups
        const groupKeys = Object.keys(hueGroups).sort(() => Math.random() - 0.5);

        for (const groupKey of groupKeys) {
            if (batch.length >= size) break;

            const group = hueGroups[groupKey];
            if (group.length === 0) continue;

            // If this hue group isn't represented yet, add a color from it
            if (!usedGroups.has(parseInt(groupKey))) {
                // Pick a random color from the group (not always the highest rated)
                const randomIndex = Math.floor(Math.random() * Math.min(3, group.length));
                const color = group[randomIndex];

                if (!batch.includes(color)) {
                    batch.push(color);
                    usedGroups.add(parseInt(groupKey));
                }
            }
        }

        // Fill remaining slots with random colors not yet in batch
        const remaining = available.filter(c => !batch.includes(c));
        while (batch.length < size && remaining.length > 0) {
            const randomIndex = Math.floor(Math.random() * remaining.length);
            batch.push(remaining.splice(randomIndex, 1)[0]);
        }

        // Sort batch by hue for visual grouping (similar colors adjacent)
        batch.sort((a, b) => a.hsl.h - b.hsl.h);

        return batch;
    };

    EloPickerState.prototype.groupByHue = function(colors) {
        // Group colors into 12 hue ranges (30 degrees each)
        const groups = {};
        for (let i = 0; i < 12; i++) {
            groups[i] = [];
        }

        colors.forEach(color => {
            const groupIndex = this.getHueGroup(color.hsl.h);
            groups[groupIndex].push(color);
        });

        // Sort each group by rating (highest first)
        Object.values(groups).forEach(group => {
            group.sort((a, b) => b.eloRating - a.eloRating);
        });

        return groups;
    };

    EloPickerState.prototype.getHueGroup = function(hue) {
        return Math.floor(hue / 30) % 12;
    };

    EloPickerState.prototype.pick = function(picked) {
        if (!this.evaluating || picked.length === 0) return;
        if (this.sessionComplete || this.analytics.sessionComparisons >= this.maxComparisons) {
            this.sessionComplete = true;
            this.evaluating = null;
            return;
        }
        
        const now = Date.now();
        const decisionTime = now - this.lastActionTime;
        this.analytics.decisionTimes.push(decisionTime);
        this.analytics.averageDecisionTime = 
            this.analytics.decisionTimes.reduce((a, b) => a + b, 0) / this.analytics.decisionTimes.length;
        
        const pickedSet = new Set(picked);
        const winners = this.evaluating.filter(c => pickedSet.has(c.id));
        const losers = this.evaluating.filter(c => !pickedSet.has(c.id));
        
        winners.forEach(winner => {
            losers.forEach(loser => {
                updateEloRatings(winner, loser, false);
            });
        });
        
        if (winners.length > 1) {
            for (let i = 0; i < winners.length; i++) {
                for (let j = i + 1; j < winners.length; j++) {
                    updateEloRatings(winners[i], winners[j], true);
                }
            }
        }
        
        this.analytics.sessionComparisons++;
        this.analytics.totalComparisons++;
        this.analytics.picks++;
        
        this.checkForNewFavorites();
        
        if (this.analytics.sessionComparisons >= this.maxComparisons) {
            this.sessionComplete = true;
            this.evaluating = null;
        } else {
            this.nextBatch();
        }
    };

    EloPickerState.prototype.pass = function() {
        if (!this.evaluating) return;
        if (this.sessionComplete || this.analytics.sessionComparisons >= this.maxComparisons) {
            this.sessionComplete = true;
            this.evaluating = null;
            return;
        }
        
        const now = Date.now();
        const decisionTime = now - this.lastActionTime;
        this.analytics.decisionTimes.push(decisionTime);
        this.analytics.averageDecisionTime = 
            this.analytics.decisionTimes.reduce((a, b) => a + b, 0) / this.analytics.decisionTimes.length;
        
        for (let i = 0; i < this.evaluating.length; i++) {
            for (let j = i + 1; j < this.evaluating.length; j++) {
                updateEloRatings(this.evaluating[i], this.evaluating[j], true);
            }
        }
        
        this.analytics.sessionComparisons++;
        this.analytics.passes++;
        
        if (this.analytics.sessionComparisons >= this.maxComparisons) {
            this.sessionComplete = true;
            this.evaluating = null;
        } else {
            this.nextBatch();
        }
    };

    EloPickerState.prototype.checkForNewFavorites = function() {
        if (this.analytics.sessionComparisons >= 20) {
            const available = this.colors.filter(c => 
                !this.eliminated.includes(c) && 
                !this.favorites.includes(c) &&
                c.comparisons >= 10
            );
            
            const sorted = available.sort((a, b) => b.eloRating - a.eloRating);
            
            if (sorted.length > 0) {
                const topColor = sorted[0];
                const secondBest = sorted[1]?.eloRating || 1500;
                
                if (topColor.eloRating > secondBest + 100 || this.analytics.sessionComparisons >= 25) {
                    this.favorites.push(topColor);
                }
            }
        }
    };

    EloPickerState.prototype.getTopColors = function(count) {
        return [...this.colors]
            .sort((a, b) => b.eloRating - a.eloRating)
            .slice(0, count);
    };

    EloPickerState.prototype.reset = function() {
        this.initialize(this.settings);
    };

    EloPickerState.prototype.setSettings = function(settings) {
        this.settings = settings;
    };

    EloPickerState.prototype.setFavorites = function(favorites) {
        const colorMap = new Map(this.colors.map(c => [c.id, c]));
        this.favorites = favorites.map(id => colorMap.get(id)).filter(c => c);
    };

    // ============================================
    // EXPORTS
    // ============================================

    return {
        EloPickerState: EloPickerState,
        generatePerceptuallyDistinctColors: generatePerceptuallyDistinctColors,
        simulateColorBlindness: simulateColorBlindness,
        getPatternForColor: getPatternForColor,
        hslToHex: hslToHex,
        hslToRgb: hslToRgb
    };
}));