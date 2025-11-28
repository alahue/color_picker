/**
 * Enhanced Features Integration
 * 
 * Integrates tooltip system, consistency tracker, and palette library
 * with the main color picker application
 * 
 * Created by: Frederick Gyasi & Austin LaHue
 */

'use strict';

(function() {
    $(document).ready(function() {
        console.log('Initializing enhanced features...');
        
        // Wait for main app to initialize
        setTimeout(function() {
            initializeEnhancedFeatures();
        }, 1000);
    });
    
    function initializeEnhancedFeatures() {
        // Get references to global objects
        var pickerState = window.pickerState;
        var pickerUI = window.pickerUI;
        
        if (!pickerState || !pickerUI) {
            console.error('Main picker not initialized yet');
            return;
        }
        
        // ============================================
        // INITIALIZE TOOLTIP SYSTEM
        // ============================================
        
        var tooltipManager = new TooltipManager({
            delay: 300,
            duration: 200,
            position: 'top'
        });
        
        // Add tooltips to color items dynamically
        function addColorTooltips() {
            $('.color-item').each(function() {
                var color = $(this).data('color');
                if (color) {
                    var winRate = color.comparisons > 0 ? 
                        Math.round((color.wins / color.comparisons) * 100) : 0;
                    
                    $(this).attr('data-tooltip', JSON.stringify({
                        title: 'Color ' + (pickerState.colors.indexOf(color) + 1),
                        hex: color.hex,
                        rgb: color.rgb,
                        hsl: color.hsl,
                        rating: color.eloRating,
                        comparisons: color.comparisons,
                        winRate: winRate,
                        description: 'Click to select this color for comparison',
                        action: 'Hover for details, Click to select'
                    }));
                }
            });
        }
        
        // Observe DOM changes to add tooltips to new colors
        var observer = new MutationObserver(function(mutations) {
            addColorTooltips();
        });
        
        observer.observe(document.getElementById('evaluating'), {
            childList: true,
            subtree: true
        });
        
        observer.observe(document.getElementById('favorites'), {
            childList: true,
            subtree: true
        });
        
        // ============================================
        // INITIALIZE CONSISTENCY TRACKER
        // ============================================
        
        var consistencyTracker = new ConsistencyTracker({
            storageKey: 'colorPicker_sessionHistory',
            maxSessions: 10
        });
        
        window.consistencyTracker = consistencyTracker; // Make globally accessible
        
        // Show consistency report
        $('#show-consistency').on('click', function() {
            showConsistencyReport();
        });
        
        function showConsistencyReport() {
            var report = consistencyTracker.generateConsistencyReport();
            
            if (report.error) {
                $('#consistency-score-display').html(
                    '<div class="consistency-score">' +
                    '<div class="consistency-score-label">' + report.error + '</div>' +
                    '</div>'
                );
            } else {
                // Display overall score
                var scoreHtml = '<div class="consistency-score">';
                scoreHtml += '<div class="consistency-score-value">' + report.summary.averageOverlap + '</div>';
                scoreHtml += '<div class="consistency-score-label">Average Consistency Score</div>';
                scoreHtml += '<div class="consistency-target ' + (report.summary.meetsConsistencyTarget ? 'met' : 'not-met') + '">';
                scoreHtml += report.summary.meetsConsistencyTarget ? 
                    '✓ Exceeds 80% target (High Consistency)' : 
                    '⚠ Target: 80% (Continue testing for validation)';
                scoreHtml += '</div>';
                scoreHtml += '<div style="margin-top: 15px;">';
                scoreHtml += 'Correlation: ' + report.summary.averageCorrelation + ' | ';
                scoreHtml += 'Sessions: ' + report.summary.totalSessions + ' | ';
                scoreHtml += 'Comparisons: ' + report.summary.totalComparisons;
                scoreHtml += '</div>';
                scoreHtml += '</div>';
                
                $('#consistency-score-display').html(scoreHtml);
                
                // Display session cards
                var sessionsHtml = '<h3>Session History</h3>';
                report.sessions.forEach(function(session, i) {
                    sessionsHtml += '<div class="consistency-session-card">';
                    sessionsHtml += '<div class="consistency-session-date">Session ' + (i + 1) + ': ' + session.date + '</div>';
                    sessionsHtml += '<div class="consistency-session-stats">';
                    sessionsHtml += 'Comparisons: ' + session.comparisons + ' | Duration: ' + session.duration;
                    sessionsHtml += '</div>';
                    sessionsHtml += '</div>';
                });
                
                $('#consistency-sessions-display').html(sessionsHtml);
                
                // Display pairwise comparisons
                var pairwiseHtml = '<h3>Pairwise Consistency</h3>';
                report.pairwiseConsistency.forEach(function(comparison) {
                    pairwiseHtml += '<div class="consistency-comparison">';
                    pairwiseHtml += '<div class="consistency-comparison-sessions">';
                    pairwiseHtml += comparison.session1Date + ' vs ' + comparison.session2Date;
                    pairwiseHtml += '<br><small>Matched ' + comparison.matchedColors + ' colors</small>';
                    pairwiseHtml += '</div>';
                    pairwiseHtml += '<div class="consistency-comparison-score">' + comparison.overlap + '</div>';
                    pairwiseHtml += '</div>';
                });
                
                $('#consistency-pairwise-display').html(pairwiseHtml);
            }
            
            // Show section
            $('#consistency-section').slideDown();
            
            // Scroll to section
            $('html, body').animate({
                scrollTop: $('#consistency-section').offset().top - 20
            }, 500);
        }
        
        // Export consistency reports
        $('#export-consistency-json').on('click', function() {
            var report = consistencyTracker.exportReport('json');
            downloadFile('consistency-report.json', report, 'application/json');
        });
        
        $('#export-consistency-text').on('click', function() {
            var report = consistencyTracker.exportReport('text');
            downloadFile('consistency-report.txt', report, 'text/plain');
        });
        
        $('#export-consistency-csv').on('click', function() {
            var report = consistencyTracker.exportReport('csv');
            downloadFile('consistency-report.csv', report, 'text/csv');
        });
        
        // ============================================
        // INITIALIZE PALETTE LIBRARY
        // ============================================
        
        var paletteLibrary = new PaletteLibrary({
            storageKey: 'colorPicker_paletteLibrary',
            maxPalettes: 50,
            autoSave: true
        });
        
        window.paletteLibrary = paletteLibrary; // Make globally accessible
        
        // Initial render
        renderPaletteLibrary();
        
        // Save current palette
        $('#save-current-palette').on('click', function() {
            showSavePaletteModal();
        });
        
        // Search palettes
        $('#palette-search').on('input', function() {
            var query = $(this).val();
            if (query) {
                var results = paletteLibrary.searchPalettes(query);
                renderPaletteLibrary(results);
            } else {
                renderPaletteLibrary();
            }
        });
        
        // Sort palettes
        $('#palette-sort').on('change', function() {
            var sortBy = $(this).val();
            paletteLibrary.sortPalettes(sortBy);
            renderPaletteLibrary();
        });
        
        function renderPaletteLibrary(palettes) {
            palettes = palettes || paletteLibrary.getAllPalettes();
            var $grid = $('#palette-grid');
            var $emptyState = $('#palette-empty-state');
            
            if (palettes.length === 0) {
                $grid.hide();
                $emptyState.show();
                return;
            }
            
            $grid.show();
            $emptyState.hide();
            $grid.empty();
            
            palettes.forEach(function(palette) {
                var $card = createPaletteCard(palette);
                $grid.append($card);
            });
        }
        
        function createPaletteCard(palette) {
            var $card = $('<div class="palette-card"></div>');
            if (palette.isFavorite) $card.addClass('favorite');
            
            // Header
            var $header = $('<div class="palette-card-header"></div>');
            $header.append('<h3 class="palette-name">' + palette.name + '</h3>');
            
            var $favIcon = $('<span class="palette-favorite-icon ' + (palette.isFavorite ? 'active' : '') + '">★</span>');
            $favIcon.on('click', function(e) {
                e.stopPropagation();
                paletteLibrary.toggleFavorite(palette.id);
                renderPaletteLibrary();
            });
            $header.append($favIcon);
            
            $card.append($header);
            
            // Description
            if (palette.description) {
                $card.append('<p class="palette-description">' + palette.description + '</p>');
            }
            
            // Color preview
            var $preview = $('<div class="palette-colors-preview"></div>');
            palette.colors.slice(0, 10).forEach(function(color) {
                var $swatch = $('<div class="palette-color-swatch"></div>');
                $swatch.css('background-color', color.hex);
                $swatch.attr('title', color.hex);
                $preview.append($swatch);
            });
            $card.append($preview);
            
            // Metadata
            var $metadata = $('<div class="palette-metadata"></div>');
            $metadata.append('<span>' + palette.metadata.colorCount + ' colors</span>');
            $metadata.append('<span>' + new Date(palette.createdAt).toLocaleDateString() + '</span>');
            $card.append($metadata);
            
            // Tags
            if (palette.tags && palette.tags.length > 0) {
                var $tags = $('<div class="palette-tags"></div>');
                palette.tags.forEach(function(tag) {
                    $tags.append('<span class="palette-tag">' + tag + '</span>');
                });
                $card.append($tags);
            }
            
            // Actions
            var $actions = $('<div class="palette-actions"></div>');
            
            $actions.append(
                $('<button class="palette-action-btn">Load</button>').on('click', function(e) {
                    e.stopPropagation();
                    loadPalette(palette);
                })
            );
            
            $actions.append(
                $('<button class="palette-action-btn">Export</button>').on('click', function(e) {
                    e.stopPropagation();
                    exportPalette(palette);
                })
            );
            
            $actions.append(
                $('<button class="palette-action-btn">Duplicate</button>').on('click', function(e) {
                    e.stopPropagation();
                    paletteLibrary.duplicatePalette(palette.id);
                    renderPaletteLibrary();
                })
            );
            
            $actions.append(
                $('<button class="palette-action-btn danger">Delete</button>').on('click', function(e) {
                    e.stopPropagation();
                    if (confirm('Delete "' + palette.name + '"?')) {
                        paletteLibrary.deletePalette(palette.id);
                        renderPaletteLibrary();
                    }
                })
            );
            
            $card.append($actions);
            
            return $card;
        }
        
        function loadPalette(palette) {
            // This would load the palette into the picker
            alert('Load palette functionality: Would restore these ' + palette.metadata.colorCount + ' colors to the picker');
        }
        
        function exportPalette(palette) {
            // Show export options
            var format = prompt('Export format: json, css, hex, scss', 'json');
            if (format) {
                var exported = paletteLibrary.exportPalette(palette.id, format);
                var extension = format === 'scss' ? 'scss' : format === 'css' ? 'css' : format === 'hex' ? 'txt' : 'json';
                downloadFile(palette.name + '.' + extension, exported, 'text/plain');
            }
        }
        
        // ============================================
        // SAVE PALETTE MODAL
        // ============================================
        
        window.showSavePaletteModal = function() {
            $('#save-palette-modal').addClass('show');
            $('#palette-name-input').val('My Palette ' + (paletteLibrary.getAllPalettes().length + 1));
            $('#palette-name-input').focus();
        };
        
        window.closeSavePaletteModal = function() {
            $('#save-palette-modal').removeClass('show');
        };
        
        window.confirmSavePalette = function() {
            var name = $('#palette-name-input').val().trim();
            if (!name) {
                alert('Please enter a palette name');
                return;
            }

            var description = $('#palette-description-input').val().trim();
            var tagsInput = $('#palette-tags-input').val().trim();
            var tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

            // Get top colors but only include those the user has selected at least once (wins > 0)
            // Maximum 10 colors in a saved palette
            var allTopColors = pickerState.getTopColors(100);
            var topColors = allTopColors.filter(function(c) { return c.wins > 0; }).slice(0, 10);

            if (topColors.length === 0) {
                alert('No colors have been selected yet. Please make some comparisons first.');
                return;
            }

            var palette = paletteLibrary.savePalette({
                name: name,
                description: description,
                tags: tags,
                colors: topColors.map(c => ({
                    id: c.id,
                    hex: c.hex,
                    rgb: c.rgb,
                    hsl: c.hsl,
                    rating: c.eloRating,
                    comparisons: c.comparisons
                })),
                sessionComparisons: pickerState.analytics.sessionComparisons,
                sessionDuration: Date.now() - pickerState.analytics.sessionStartTime
            });
            
            // Record session for consistency tracking (only colors user has selected)
            consistencyTracker.recordSession({
                topColors: topColors.map(c => ({
                    id: c.id,
                    hex: c.hex,
                    eloRating: c.eloRating
                })),
                allColors: pickerState.colors.filter(c => c.wins > 0).map(c => ({
                    id: c.id,
                    hex: c.hex,
                    eloRating: c.eloRating,
                    comparisons: c.comparisons,
                    wins: c.wins,
                    losses: c.losses
                })),
                analytics: pickerState.analytics
            });
            
            closeSavePaletteModal();
            renderPaletteLibrary();
            
            alert('✓ Palette "' + name + '" saved successfully!');
            
            // Clear form
            $('#palette-description-input').val('');
            $('#palette-tags-input').val('');
        };
        
        // Close modal on overlay click
        $('#save-palette-modal').on('click', function(e) {
            if (e.target === this) {
                closeSavePaletteModal();
            }
        });
        
        // ============================================
        // UTILITY FUNCTIONS
        // ============================================
        
        function downloadFile(filename, content, mimeType) {
            var blob = new Blob([content], { type: mimeType });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        console.log('✓ Enhanced features initialized successfully!');
        console.log('✓ Tooltip system active');
        console.log('✓ Consistency tracker ready (' + consistencyTracker.getSessions().length + ' sessions)');
        console.log('✓ Palette library loaded (' + paletteLibrary.getAllPalettes().length + ' palettes)');
    }
})();
