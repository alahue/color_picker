/**
 * Session Consistency Tracker
 * 
 * Tracks and compares color preferences across multiple sessions
 * to validate preference consistency (target: >80%)
 * 
 * Created by: Frederick Gyasi & Austin LaHue
 */

'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ConsistencyTracker = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    function ConsistencyTracker(options) {
        this.options = options || {};
        this.storageKey = this.options.storageKey || 'colorPicker_sessionHistory';
        this.userIdKey = 'colorPicker_userId';
        this.maxSessions = this.options.maxSessions || 10;
        
        // Initialize or retrieve user ID
        this.userId = this.initializeUserId();
        this.sessions = this.loadSessions();
        
        console.log('ConsistencyTracker initialized for user:', this.userId);
    }

    // ============================================
    // USER IDENTIFICATION
    // ============================================

    ConsistencyTracker.prototype.initializeUserId = function() {
        try {
            var existingId = localStorage.getItem(this.userIdKey);
            if (existingId) {
                return existingId;
            }
            
            // Generate new user ID
            var newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(this.userIdKey, newId);
            console.log('New user ID generated:', newId);
            return newId;
        } catch (e) {
            console.error('Failed to initialize user ID:', e);
            // Fallback to session-only ID
            return 'user_' + Date.now();
        }
    };

    ConsistencyTracker.prototype.getUserId = function() {
        return this.userId;
    };

    ConsistencyTracker.prototype.resetUserId = function() {
        try {
            var newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(this.userIdKey, newId);
            this.userId = newId;
            
            // Clear sessions for old user
            this.sessions = [];
            this.saveSessions();
            
            console.log('User ID reset. New ID:', newId);
            return newId;
        } catch (e) {
            console.error('Failed to reset user ID:', e);
            return this.userId;
        }
    };

    // ============================================
    // SESSION MANAGEMENT
    // ============================================

    ConsistencyTracker.prototype.loadSessions = function() {
        try {
            var data = localStorage.getItem(this.storageKey);
            var sessions = data ? JSON.parse(data) : [];

            // Migrate legacy sessions: assign current userId to sessions without one
            var self = this;
            var migrated = false;
            sessions = sessions.map(function(session) {
                if (!session.userId) {
                    session.userId = self.userId;
                    migrated = true;
                    console.log('Migrated legacy session:', session.id);
                }
                return session;
            });

            // Save migrated sessions
            if (migrated) {
                localStorage.setItem(this.storageKey, JSON.stringify(sessions));
                console.log('Legacy sessions migrated to current user');
            }

            return sessions;
        } catch (e) {
            console.error('Failed to load session history:', e);
            return [];
        }
    };

    ConsistencyTracker.prototype.saveSessions = function() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.sessions));
            return true;
        } catch (e) {
            console.error('Failed to save session history:', e);
            return false;
        }
    };

    ConsistencyTracker.prototype.recordSession = function(sessionData) {
        var session = {
            id: this.generateSessionId(),
            userId: this.userId,  // Associate session with user
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            topColors: sessionData.topColors || [],
            allColors: sessionData.allColors || [],
            analytics: sessionData.analytics || {},
            metadata: {
                comparisons: sessionData.analytics?.sessionComparisons || 0,
                sessionDuration: sessionData.analytics?.sessionDuration || 0,
                picks: sessionData.analytics?.picks || 0,
                passes: sessionData.analytics?.passes || 0
            }
        };

        this.sessions.unshift(session);
        
        // Keep only most recent sessions
        if (this.sessions.length > this.maxSessions) {
            this.sessions = this.sessions.slice(0, this.maxSessions);
        }
        
        this.saveSessions();
        console.log('Session recorded for user', this.userId, '- Total sessions:', this.sessions.length);
        return session;
    };

    ConsistencyTracker.prototype.generateSessionId = function() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };

    ConsistencyTracker.prototype.getSessions = function(userId) {
        // If userId specified, filter by that user
        if (userId) {
            return this.sessions.filter(s => s.userId === userId);
        }
        // Otherwise return sessions for current user only
        return this.sessions.filter(s => s.userId === this.userId);
    };

    ConsistencyTracker.prototype.getAllSessions = function() {
        // Return all sessions regardless of user
        return this.sessions;
    };

    ConsistencyTracker.prototype.getUserSessions = function(userId) {
        // Get sessions for specific user
        return this.sessions.filter(s => s.userId === userId);
    };

    ConsistencyTracker.prototype.getSession = function(sessionId) {
        return this.sessions.find(s => s.id === sessionId);
    };

    ConsistencyTracker.prototype.deleteSession = function(sessionId) {
        this.sessions = this.sessions.filter(s => s.id !== sessionId);
        this.saveSessions();
    };

    ConsistencyTracker.prototype.clearCurrentUserSessions = function() {
        // Clear current user's sessions AND any legacy sessions without userId
        this.sessions = this.sessions.filter(function(s) {
            // Keep sessions that belong to OTHER users (not current user, and has a userId)
            return s.userId && s.userId !== this.userId;
        }.bind(this));
        this.saveSessions();
        console.log('Cleared all sessions for user:', this.userId);
    };

    ConsistencyTracker.prototype.clearAllSessions = function() {
        this.sessions = [];
        this.saveSessions();
    };

    // ============================================
    // CONSISTENCY ANALYSIS
    // ============================================

    ConsistencyTracker.prototype.calculateConsistency = function(session1, session2, options) {
        options = options || {};
        var topN = options.topN || 10;
        
        var colors1 = this.getTopNColors(session1, topN);
        var colors2 = this.getTopNColors(session2, topN);
        
        // Calculate overlap
        var overlap = colors1.filter(id => colors2.includes(id));
        var overlapPercentage = (overlap.length / topN) * 100;
        
        // Calculate rank correlation (Spearman's rho approximation)
        var rankCorrelation = this.calculateRankCorrelation(colors1, colors2, overlap);
        
        return {
            overlapCount: overlap.length,
            overlapPercentage: overlapPercentage,
            rankCorrelation: rankCorrelation,
            matchedColors: overlap,
            session1Colors: colors1,
            session2Colors: colors2,
            topN: topN
        };
    };

    ConsistencyTracker.prototype.getTopNColors = function(session, n) {
        if (session.topColors && session.topColors.length > 0) {
            return session.topColors.slice(0, n).map(c => c.id || c.hex || c);
        }
        
        if (session.allColors && session.allColors.length > 0) {
            return session.allColors
                .sort((a, b) => (b.eloRating || b.rating || 0) - (a.eloRating || a.rating || 0))
                .slice(0, n)
                .map(c => c.id || c.hex || c);
        }
        
        return [];
    };

    ConsistencyTracker.prototype.calculateRankCorrelation = function(colors1, colors2, overlap) {
        if (overlap.length === 0) return 0;
        
        var sumSquaredDiff = 0;
        var n = overlap.length;
        
        overlap.forEach(colorId => {
            var rank1 = colors1.indexOf(colorId);
            var rank2 = colors2.indexOf(colorId);
            var diff = rank1 - rank2;
            sumSquaredDiff += diff * diff;
        });
        
        // Spearman's rho formula
        var correlation = 1 - (6 * sumSquaredDiff) / (n * (n * n - 1));
        return Math.max(-1, Math.min(1, correlation)); // Clamp between -1 and 1
    };

    ConsistencyTracker.prototype.calculatePairwiseConsistency = function(sessionIds, options) {
        var results = [];
        
        for (var i = 0; i < sessionIds.length; i++) {
            for (var j = i + 1; j < sessionIds.length; j++) {
                var session1 = this.getSession(sessionIds[i]);
                var session2 = this.getSession(sessionIds[j]);
                
                if (session1 && session2) {
                    var consistency = this.calculateConsistency(session1, session2, options);
                    results.push({
                        session1: sessionIds[i],
                        session2: sessionIds[j],
                        session1Date: session1.date,
                        session2Date: session2.date,
                        consistency: consistency
                    });
                }
            }
        }
        
        return results;
    };

    ConsistencyTracker.prototype.calculateOverallConsistency = function(options) {
        // Only analyze current user's sessions
        var userSessions = this.sessions.filter(s => s.userId === this.userId);
        
        if (userSessions.length < 2) {
            return {
                error: 'Need at least 2 sessions for consistency analysis',
                sessionCount: userSessions.length,
                userId: this.userId
            };
        }
        
        var sessionIds = userSessions.map(s => s.id);
        var pairwiseResults = this.calculatePairwiseConsistency(sessionIds, options);
        
        var totalOverlap = 0;
        var totalCorrelation = 0;
        
        pairwiseResults.forEach(result => {
            totalOverlap += result.consistency.overlapPercentage;
            totalCorrelation += result.consistency.rankCorrelation;
        });
        
        var avgOverlap = totalOverlap / pairwiseResults.length;
        var avgCorrelation = totalCorrelation / pairwiseResults.length;
        
        return {
            userId: this.userId,
            sessionCount: userSessions.length,
            comparisonCount: pairwiseResults.length,
            averageOverlapPercentage: avgOverlap,
            averageRankCorrelation: avgCorrelation,
            meetsTarget: avgOverlap >= 80, // 80% target from proposal
            pairwiseResults: pairwiseResults
        };
    };

    // ============================================
    // REPORTING
    // ============================================

    ConsistencyTracker.prototype.generateConsistencyReport = function(options) {
        var overall = this.calculateOverallConsistency(options);
        
        if (overall.error) {
            return overall;
        }
        
        var report = {
            generatedAt: new Date().toISOString(),
            userId: this.userId,  // Include user ID in report
            summary: {
                totalSessions: overall.sessionCount,
                totalComparisons: overall.comparisonCount,
                averageOverlap: Math.round(overall.averageOverlapPercentage * 10) / 10 + '%',
                averageCorrelation: Math.round(overall.averageRankCorrelation * 100) / 100,
                meetsConsistencyTarget: overall.meetsTarget,
                targetPercentage: '80%'
            },
            sessions: this.sessions.map(s => ({
                id: s.id,
                date: s.date,
                time: s.time,
                comparisons: s.metadata.comparisons,
                duration: Math.round(s.metadata.sessionDuration / 1000) + 's',
                topColors: s.topColors ? s.topColors.slice(0, 5) : []
            })),
            pairwiseConsistency: overall.pairwiseResults.map(r => ({
                session1Date: r.session1Date,
                session2Date: r.session2Date,
                overlap: Math.round(r.consistency.overlapPercentage) + '%',
                correlation: Math.round(r.consistency.rankCorrelation * 100) / 100,
                matchedColors: r.consistency.matchedColors.length
            }))
        };
        
        return report;
    };

    ConsistencyTracker.prototype.exportReport = function(format) {
        var report = this.generateConsistencyReport();
        
        if (report.error) {
            return { error: report.error };
        }
        
        switch(format) {
            case 'json':
                return JSON.stringify(report, null, 2);
            case 'csv':
                return this.reportToCSV(report);
            case 'text':
                return this.reportToText(report);
            default:
                return report;
        }
    };

    ConsistencyTracker.prototype.reportToText = function(report) {
        var text = 'COLOR PREFERENCE CONSISTENCY REPORT\n';
        text += '====================================\n\n';
        text += 'Generated: ' + new Date(report.generatedAt).toLocaleString() + '\n\n';
        
        text += 'SUMMARY\n';
        text += '-------\n';
        text += 'Total Sessions: ' + report.summary.totalSessions + '\n';
        text += 'Total Comparisons: ' + report.summary.totalComparisons + '\n';
        text += 'Average Overlap: ' + report.summary.averageOverlap + '\n';
        text += 'Average Correlation: ' + report.summary.averageCorrelation + '\n';
        text += 'Meets Target (>80%): ' + (report.summary.meetsConsistencyTarget ? 'YES ✓' : 'NO ✗') + '\n\n';
        
        text += 'SESSION HISTORY\n';
        text += '---------------\n';
        report.sessions.forEach((s, i) => {
            text += (i + 1) + '. ' + s.date + ' ' + s.time + '\n';
            text += '   Comparisons: ' + s.comparisons + ', Duration: ' + s.duration + '\n';
        });
        
        text += '\nPAIRWISE CONSISTENCY\n';
        text += '--------------------\n';
        report.pairwiseConsistency.forEach((p, i) => {
            text += (i + 1) + '. ' + p.session1Date + ' vs ' + p.session2Date + '\n';
            text += '   Overlap: ' + p.overlap + ', Correlation: ' + p.correlation + '\n';
        });
        
        return text;
    };

    ConsistencyTracker.prototype.reportToCSV = function(report) {
        var csv = 'Session 1,Session 2,Overlap %,Correlation,Matched Colors\n';
        
        report.pairwiseConsistency.forEach(p => {
            csv += p.session1Date + ',' + p.session2Date + ',';
            csv += p.overlap + ',' + p.correlation + ',' + p.matchedColors + '\n';
        });
        
        return csv;
    };

    // ============================================
    // COLOR STABILITY ANALYSIS
    // ============================================

    ConsistencyTracker.prototype.analyzeColorStability = function() {
        if (this.sessions.length < 2) {
            return { error: 'Need at least 2 sessions' };
        }
        
        var colorFrequency = {};
        var colorRankings = {};
        
        this.sessions.forEach((session, sessionIndex) => {
            var topColors = this.getTopNColors(session, 10);
            
            topColors.forEach((colorId, rank) => {
                if (!colorFrequency[colorId]) {
                    colorFrequency[colorId] = 0;
                    colorRankings[colorId] = [];
                }
                colorFrequency[colorId]++;
                colorRankings[colorId].push({ session: sessionIndex, rank: rank + 1 });
            });
        });
        
        var stableColors = [];
        for (var colorId in colorFrequency) {
            var frequency = colorFrequency[colorId];
            var appearanceRate = (frequency / this.sessions.length) * 100;
            var rankings = colorRankings[colorId];
            var avgRank = rankings.reduce((sum, r) => sum + r.rank, 0) / rankings.length;
            var rankStdDev = this.calculateStdDev(rankings.map(r => r.rank));
            
            stableColors.push({
                colorId: colorId,
                appearances: frequency,
                appearanceRate: Math.round(appearanceRate),
                averageRank: Math.round(avgRank * 10) / 10,
                rankStability: Math.round((1 / (1 + rankStdDev)) * 100),
                isHighlyStable: appearanceRate >= 80 && rankStdDev < 2
            });
        }
        
        stableColors.sort((a, b) => b.appearanceRate - a.appearanceRate);
        
        return {
            mostStableColors: stableColors.filter(c => c.isHighlyStable),
            allColorStability: stableColors,
            sessionCount: this.sessions.length
        };
    };

    ConsistencyTracker.prototype.calculateStdDev = function(values) {
        if (values.length === 0) return 0;
        var avg = values.reduce((a, b) => a + b, 0) / values.length;
        var squaredDiffs = values.map(v => Math.pow(v - avg, 2));
        var variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(variance);
    };

    return ConsistencyTracker;
}));
