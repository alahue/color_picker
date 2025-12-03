/**
 * Color Picker Application Initialization
 * Created by: Austin LaHue & Frederick Gyasi
 */

'use strict';

(function() {
    $(document).ready(function() {
        console.log('Initializing Color Picker...');
        
        var pickerState = new ColorPickerCore.EloPickerState({
            colorCount: 200,
            generateColors: true,
            maxComparisons: 20,
            defaultSettings: {
                batchSize: 10
            }
        });
        
        pickerState.initialize();
        
        console.log('Picker state initialized. Colors:', pickerState.colors ? pickerState.colors.length : 0);
        console.log('Evaluating batch:', pickerState.evaluating ? pickerState.evaluating.length : 0);
        
        var pickerUI = new PickerUI(pickerState, {
            elements: {
                evaluating: '#evaluating',
                favorites: '#favorites',
                topFive: '#top-five',
                exportSection: '#export-section',
                pick: '#pick',
                pass: '#pass',
                undo: '#undo',
                redo: '#redo',
                reset: '#reset',
                progressBar: '#progress-bar',
                progressText: '#progress-text',
                picksCount: '#picks-count',
                passesCount: '#passes-count',
                avgTime: '#avg-time',
                exportJSON: '#export-json',
                exportCSS: '#export-css',
                exportHex: '#export-hex',
                accessibilityMode: '#accessibility-mode',
                highContrast: '#high-contrast',
                patterns: '#patterns',
                audioDescriptions: '#audio-descriptions',
                surveySection: '#survey-section',
                feedbackForm: '#feedback-form'
            },
            messages: {
                reset: "Reset Picker",
                mustSelect: "Please select at least one color before picking! If you're indifferent, press Pass.",
                sessionComplete: "Session Complete! Your personalized palette is ready.",
                noColors: "No colors available. This shouldn't happen!",
                resetWarning: "Are you sure you want to reset? All your progress will be lost.",
                exportSuccess: "Palette exported successfully!",
                audioEnabled: "Audio descriptions enabled. The system will now read color information.",
                audioDisabled: "Audio descriptions disabled.",
                maxComparisonsReached: "You have reached the maximum number of comparisons (20). Your session is complete."
            }
        });
        
        pickerUI.initialize();
        
        window.pickerState = pickerState;
        window.pickerUI = pickerUI;
        
        console.log('UI initialized');
        
        setInterval(function() {
            updateAnalyticsDisplay();
        }, 500);
        
        function updateAnalyticsDisplay() {
            if (!pickerState.analytics) return;
            
            $('#picks-count').text(pickerState.analytics.picks || 0);
            $('#passes-count').text(pickerState.analytics.passes || 0);
            
            var avgTime = pickerState.analytics.averageDecisionTime || 0;
            $('#avg-time').text((avgTime / 1000).toFixed(1) + 's');
            
            if (pickerState.analytics.sessionComparisons >= 20 && 
                !$('#survey-section').data('shown')) {
                $('#survey-section').slideDown();
                $('#survey-section').data('shown', true);
            }
        }
        
        $('#feedback-form').on('submit', function(e) {
            e.preventDefault();
            
            var feedback = {
                timestamp: new Date().toISOString(),
                helpfulness: $('input[name="helpfulness"]:checked').val(),
                satisfaction: $('#satisfaction').val(),
                useCase: $('#use-case').val(),
                comments: $('#comments').val(),
                analytics: pickerState.analytics,
                topColors: pickerState.getTopColors(10).map(c => ({
                    hex: c.hex,
                    rating: Math.round(c.eloRating)
                }))
            };
            
            console.log('Survey Response Submitted:', feedback);
            console.log('Survey Data Storage Location: localStorage key "colorPickerFeedback"');
            console.log('Backend Integration Required: Data should be sent to server endpoint');
            
            var allFeedback = JSON.parse(localStorage.getItem('colorPickerFeedback') || '[]');
            allFeedback.push(feedback);
            localStorage.setItem('colorPickerFeedback', JSON.stringify(allFeedback));
            
            console.log('Total survey responses stored:', allFeedback.length);
            console.log('Note: For production use, implement server-side storage via POST request');
            console.log('Recommended endpoint: POST /api/surveys with JSON body');
            
            alert('Thank you for your feedback! Your response has been recorded.');
            $('#survey-section').slideUp();
        });
        
        setInterval(function() {
            try {
                var state = pickerState.getState();
                localStorage.setItem('colorPickerState', JSON.stringify(state));
            } catch (e) {
                console.error('Failed to save state:', e);
            }
        }, 5000);
        
        try {
            var savedState = localStorage.getItem('colorPickerState');
            if (savedState) {
                var state = JSON.parse(savedState);
                
                if (state.analytics && state.analytics.sessionComparisons > 0) {
                    if (confirm('Would you like to continue your previous session? (' + 
                               state.analytics.sessionComparisons + ' comparisons completed)')) {
                        pickerState.restoreState(state);
                        pickerUI.update();
                        pickerUI.updateProgress();
                        pickerUI.updateTopFive();
                        console.log('Previous state restored');
                    }
                }
            }
        } catch (e) {
            console.error('Failed to restore state:', e);
        }
        
        if (!localStorage.getItem('keyboardHintShown')) {
            setTimeout(function() {
                if (pickerUI.accessibility.audioDescriptions) {
                    pickerUI.announce('Tip: You can use keyboard shortcuts! Press Enter to pick, Space to pass, and arrow keys to navigate.');
                }
                localStorage.setItem('keyboardHintShown', 'true');
            }, 2000);
        }
        
        window.addEventListener('load', function() {
            if (window.performance && window.performance.timing) {
                var timing = window.performance.timing;
                var loadTime = timing.loadEventEnd - timing.navigationStart;
                console.log('Page load time:', loadTime + 'ms');
            }
        });
        
        console.log('Color Picker initialized successfully!');
        console.log('200 perceptually distinct colors loaded');
        console.log('Elo rating algorithm active');
        console.log('Maximum comparisons: 20');
        console.log('Accessibility features enabled');
        console.log('Ready for user interaction');
        console.log('');
        console.log('SURVEY DATA STORAGE:');
        console.log('  - Client-side: localStorage["colorPickerFeedback"]');
        console.log('  - Production: Requires backend endpoint for persistent storage');
        console.log('  - Access method: JSON.parse(localStorage.getItem("colorPickerFeedback"))');
        
        if (pickerUI.accessibility.audioDescriptions) {
            setTimeout(function() {
                pickerUI.announce('Welcome to the Interactive Color Preference Picker. Begin by selecting your preferred colors from each group presented.');
            }, 1000);
        }
    });
})();
// ============================================
// USER IDENTITY UI MANAGEMENT
// ============================================

$(document).ready(function() {
    // Poll for consistencyTracker to be available (handles race condition with enhanced-integration.js)
    var checkInterval = setInterval(function() {
        if (window.consistencyTracker) {
            clearInterval(checkInterval);
            initializeUserIdentityUI();
        }
    }, 100);

    // Timeout after 5 seconds if consistencyTracker never loads
    setTimeout(function() {
        clearInterval(checkInterval);
        if (!window.consistencyTracker) {
            console.error('ConsistencyTracker failed to initialize');
            $('#user-id-display').text('Error: Not initialized');
        }
    }, 5000);

    function initializeUserIdentityUI() {
        updateUserIdentityUI();

        // Copy User ID button
        $('#copy-user-id').on('click', function() {
            var userId = window.consistencyTracker.getUserId();
            navigator.clipboard.writeText(userId).then(function() {
                alert('User ID copied to clipboard!');
            }).catch(function(err) {
                console.error('Failed to copy:', err);
                alert('User ID: ' + userId);
            });
        });

        // Reset User Data button
        $('#reset-user-data').on('click', function() {
            var confirmed = confirm(
                'Are you sure you want to reset your user identity?\n\n' +
                'This will:\n' +
                '• Generate a new User ID\n' +
                '• Delete all your session history\n' +
                '• Clear consistency tracking data\n' +
                '• Start fresh as a new user\n\n' +
                'This action CANNOT be undone!'
            );

            if (confirmed) {
                // Clear current user's sessions (including legacy sessions without userId)
                window.consistencyTracker.clearCurrentUserSessions();

                // Generate new user ID
                var newUserId = window.consistencyTracker.resetUserId();

                // Update UI
                updateUserIdentityUI();

                // Reset picker state
                if (window.pickerState) {
                    window.pickerState.reset();
                    window.pickerUI.update();
                    window.pickerUI.updateProgress();
                    window.pickerUI.updateTopFive();
                }

                alert('User identity reset successfully!\n\nNew User ID: ' + newUserId);
            }
        });

        // Update session count periodically
        setInterval(updateUserIdentityUI, 3000);

        console.log('User identity UI initialized');
    }
});

function updateUserIdentityUI() {
    if (!window.consistencyTracker) return;
    
    var userId = window.consistencyTracker.getUserId();
    var sessions = window.consistencyTracker.getSessions(); // Gets current user's sessions
    
    $('#user-id-display').text(userId);
    $('#user-sessions-count').text(sessions.length);
}
