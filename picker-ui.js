/**
 * Color Picker UI with Accessibility Features
 * 
 * Building upon the foundation established by Austin LaHue's picker-ui.js
 * New features by Frederick Gyasi:
 * - Accessibility modes (protanopia, tritanopia, deuteranopia)
 * - Audio descriptions via Web Speech API
 * - Pattern overlays for color differentiation
 * - High-contrast mode
 * - Keyboard navigation
 * - Progress tracking
 * - Export functionality
 * 
 * Original UI architecture credit: Austin LaHue
 * Accessibility & UX features: Frederick Gyasi
 */

'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', './picker-core'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('jquery'), require('./picker-core'));
    } else {
        root.PickerUI = factory(root.jQuery, root.ColorPickerCore);
    }
}(typeof self !== 'undefined' ? self : this, function ($, ColorPickerCore) {

    function PickerUI(picker, options) {
        var self = this;
        
        this.picker = picker;
        this.options = options || {};
        this.state = picker;
        
        // Accessibility settings
        this.accessibility = {
            mode: 'full-color', // 'full-color', 'protanopia', 'deuteranopia', 'tritanopia'
            highContrast: false,
            patterns: false,
            audioDescriptions: false,
            keyboardNav: true
        };
        
        // Speech synthesis for audio descriptions
        this.speechSynth = window.speechSynthesis;
        this.isSpeaking = false;
        
        // Progress tracking
        this.progressTarget = 20; // Target comparisons
        
        // Initialize messages
        this.messages = $.extend({
            reset: "Reset",
            mustSelect: "You must select at least one color! If you're indifferent, press Pass.",
            sessionComplete: "Session complete! Your personalized palette is ready.",
            noColors: "No colors available. Please adjust your settings.",
            resetWarning: "Are you sure you wish to reset? All progress will be lost.",
            exportSuccess: "Palette exported successfully!",
            audioEnabled: "Audio descriptions enabled",
            audioDisabled: "Audio descriptions disabled"
        }, this.options.messages);
        
        // Initialize elements
        this.elem = this.jquerifyElements(options.elements || {});
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Initialize keyboard navigation
        if (this.accessibility.keyboardNav) {
            this.setupKeyboardNavigation();
        }
        
        return this;
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    PickerUI.prototype.jquerifyElements = function(obj) {
        var result = {};
        for (var key in obj) {
            if (key === 'settings') {
                result[key] = this.jquerifyElements(obj[key]);
            } else if (obj.hasOwnProperty(key)) {
                result[key] = $(obj[key]);
            }
        }
        return result;
    };

    // ============================================
    // COLOR NAME CONVERSION (Natural Language)
    // ============================================

    PickerUI.prototype.getColorName = function(hex, hsl) {
        var h = hsl.h;
        var s = hsl.s;
        var l = hsl.l;
        
        if (l < 15) return "black";
        if (l > 95) return "white";
        if (s < 10) {
            if (l < 30) return "dark gray";
            if (l < 60) return "gray";
            return "light gray";
        }
        
        var saturationLevel = s > 70 ? "vivid" : s > 40 ? "" : "muted";
        var lightnessLevel = l < 30 ? "dark" : l > 70 ? "light" : "";
        
        var hueRange = [
            [0, 15, "red"],
            [15, 40, "orange"],
            [40, 70, "yellow"],
            [70, 150, "green"],
            [150, 200, "cyan"],
            [200, 260, "blue"],
            [260, 290, "purple"],
            [290, 330, "magenta"],
            [330, 360, "red"]
        ];
        
        var hueName = "color";
        for (var i = 0; i < hueRange.length; i++) {
            if (h >= hueRange[i][0] && h < hueRange[i][1]) {
                hueName = hueRange[i][2];
                break;
            }
        }
        
        var parts = [];
        if (saturationLevel) parts.push(saturationLevel);
        if (lightnessLevel) parts.push(lightnessLevel);
        parts.push(hueName);
        
        return parts.join(" ");
    };

    // ============================================
    // EVENT HANDLERS
    // ============================================

    PickerUI.prototype.setupEventHandlers = function() {
        var self = this;
        
        this.elem.evaluating.on('click', '.color-item', function(e) {
            e.preventDefault();
            self.toggleSelection(this);
            self.announceSelection(this);
        });
        
        this.elem.evaluating.on('dblclick', '.color-item', function(e) {
            e.preventDefault();
            var selected = self.getSelected();
            var item = self.getColorFromElement(this);
            if (selected.length === 0 || (selected.length === 1 && selected[0].id === item.id)) {
                self.pick([item.id]);
            }
        });
        
        this.elem.pick.on('click', function(e) {
            e.preventDefault();
            self.handlePickAction();
        });
        
        this.elem.pass.on('click', function(e) {
            e.preventDefault();
            self.handlePassAction();
        });
        
        if (this.elem.undo) {
            this.elem.undo.on('click', function(e) {
                e.preventDefault();
                self.undo();
            });
        }
        
        if (this.elem.redo) {
            this.elem.redo.on('click', function(e) {
                e.preventDefault();
                self.redo();
            });
        }
        
        if (this.elem.reset) {
            this.elem.reset.on('click', function(e) {
                e.preventDefault();
                self.reset();
            });
        }
        
        if (this.elem.exportJSON) {
            this.elem.exportJSON.on('click', function(e) {
                e.preventDefault();
                self.exportPalette('json');
            });
        }
        
        if (this.elem.exportCSS) {
            this.elem.exportCSS.on('click', function(e) {
                e.preventDefault();
                self.exportPalette('css');
            });
        }
        
        if (this.elem.exportHex) {
            this.elem.exportHex.on('click', function(e) {
                e.preventDefault();
                self.exportPalette('hex');
            });
        }
        
        if (this.elem.accessibilityMode) {
            this.elem.accessibilityMode.on('change', function(e) {
                self.setAccessibilityMode($(this).val());
            });
        }
        
        if (this.elem.highContrast) {
            this.elem.highContrast.on('change', function(e) {
                self.toggleHighContrast($(this).prop('checked'));
            });
        }
        
        if (this.elem.patterns) {
            this.elem.patterns.on('change', function(e) {
                self.togglePatterns($(this).prop('checked'));
            });
        }
        
        if (this.elem.audioDescriptions) {
            this.elem.audioDescriptions.on('change', function(e) {
                self.toggleAudioDescriptions($(this).prop('checked'));
            });
        }
    };

    // ============================================
    // ACTIONS
    // ============================================

    PickerUI.prototype.setupKeyboardNavigation = function() {
        var self = this;
        
        $(document).on('keydown', function(e) {
            if ($(e.target).is('input, textarea, select')) return;
            
            switch(e.key) {
                case 'Enter':
                    e.preventDefault();
                    self.handlePickAction();
                    break;
                case ' ':
                case 'Spacebar':
                    e.preventDefault();
                    self.handlePassAction();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    self.selectNextColor(e.shiftKey);
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    self.selectPreviousColor(e.shiftKey);
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (e.shiftKey) {
                            self.redo();
                        } else {
                            self.undo();
                        }
                    }
                    break;
                case 'a':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        self.selectAllColors();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    self.clearSelection();
                    break;
            }
        });
    };

    PickerUI.prototype.initialize = function() {
        this.update();
        this.updateProgress();
        this.updateTopFive();
        
        if (this.accessibility.audioDescriptions) {
            this.announce("Color preference picker initialized. Use arrow keys to navigate, Enter to pick, Space to pass.");
        }
    };

    // ============================================
    // ACCESSIBILITY FEATURES
    // ============================================

    PickerUI.prototype.setAccessibilityMode = function(mode) {
        this.accessibility.mode = mode;
        this.update();
        
        var modeNames = {
            'full-color': 'Full color',
            'protanopia': 'Protanopia simulation',
            'deuteranopia': 'Deuteranopia simulation',
            'tritanopia': 'Tritanopia simulation'
        };
        
        this.announce("Accessibility mode changed to " + modeNames[mode]);
    };

    PickerUI.prototype.toggleHighContrast = function(enabled) {
        this.accessibility.highContrast = enabled;
        $('body').toggleClass('high-contrast', enabled);
        this.update();
        this.announce(enabled ? "High contrast mode enabled" : "High contrast mode disabled");
    };

    PickerUI.prototype.togglePatterns = function(enabled) {
        this.accessibility.patterns = enabled;
        this.update();
        this.announce(enabled ? "Pattern overlays enabled" : "Pattern overlays disabled");
    };

    PickerUI.prototype.toggleAudioDescriptions = function(enabled) {
        this.accessibility.audioDescriptions = enabled;
        this.announce(enabled ? this.messages.audioEnabled : this.messages.audioDisabled);
    };

    PickerUI.prototype.announce = function(text) {
        if (!this.accessibility.audioDescriptions || !this.speechSynth) return;
        
        // Cancel any ongoing speech
        this.speechSynth.cancel();
        
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.2;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        this.speechSynth.speak(utterance);
    };

    PickerUI.prototype.announceColor = function(color) {
        if (!color) return;
        
        var colorName = this.getColorName(color.hex, color.hsl);
        var description = "Color " + (this.state.colors.indexOf(color) + 1) + ", " + colorName;
        description += ", with rating " + Math.round(color.eloRating);
        
        this.announce(description);
    };

    PickerUI.prototype.announceSelection = function(elem) {
        if (!this.accessibility.audioDescriptions) return;
        
        var color = this.getColorFromElement(elem);
        var isSelected = $(elem).hasClass('selected');
        
        if (isSelected) {
            this.announceColor(color);
        }
    };

    // ============================================
    // COLOR RENDERING
    // ============================================

    PickerUI.prototype.renderColor = function(color) {
        var self = this;
        var displayHex = color.hex;
        var displayRgb = color.rgb;
        
        // Apply color blindness simulation if needed
        if (this.accessibility.mode !== 'full-color') {
            displayRgb = ColorPickerCore.simulateColorBlindness(color.rgb, this.accessibility.mode);
            displayHex = this.rgbToHex(displayRgb);
        }
        
        var colorName = this.getColorName(color.hex, color.hsl);
        
        var $elem = $('<div></div>')
            .addClass('color-item')
            .attr('data-color-id', color.id)
            .attr('tabindex', '0')
            .attr('role', 'button')
            .attr('aria-label', 'Color ' + (this.state.colors.indexOf(color) + 1) + ', ' + colorName)
            .css('background-color', displayHex)
            .data('color', color);
        
        // Add pattern overlay if enabled
        if (this.accessibility.patterns) {
            var pattern = ColorPickerCore.getPatternForColor(this.state.colors.indexOf(color));
            $elem.addClass('pattern-' + pattern);
        }
        
        // Add color info overlay
        var $info = $('<div class="color-info"></div>')
            .append('<span class="color-hex">' + color.hex + '</span>')
            .append('<span class="color-rating">★ ' + Math.round(color.eloRating) + '</span>');
        
        $elem.append($info);
        
        // Add high contrast border if enabled
        if (this.accessibility.highContrast) {
            $elem.addClass('high-contrast-item');
        }
        
        return $elem;
    };

    PickerUI.prototype.rgbToHex = function(rgb) {
        var toHex = function(n) {
            var hex = Math.max(0, Math.min(255, n)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
    };

    // ============================================
    // SELECTION MANAGEMENT
    // ============================================

    PickerUI.prototype.toggleSelection = function(elem) {
        $(elem).toggleClass('selected');
        $(elem).attr('aria-pressed', $(elem).hasClass('selected'));
    };

    PickerUI.prototype.getColorFromElement = function(elem) {
        return $(elem).data('color');
    };

    PickerUI.prototype.getSelected = function() {
        var self = this;
        return this.elem.evaluating.find('.color-item.selected').map(function() {
            return self.getColorFromElement(this);
        }).get();
    };

    PickerUI.prototype.clearSelection = function() {
        this.elem.evaluating.find('.color-item').removeClass('selected').attr('aria-pressed', 'false');
        this.announce("Selection cleared");
    };

    PickerUI.prototype.selectAllColors = function() {
        this.elem.evaluating.find('.color-item').addClass('selected').attr('aria-pressed', 'true');
        this.announce("All colors selected");
    };

    PickerUI.prototype.selectNextColor = function(multiSelect) {
        var $colors = this.elem.evaluating.find('.color-item');
        var $selected = $colors.filter('.selected').last();
        var $next = $selected.length ? $selected.next('.color-item') : $colors.first();
        
        if ($next.length) {
            if (!multiSelect) {
                this.clearSelection();
            }
            this.toggleSelection($next);
            $next.focus();
            this.announceColor(this.getColorFromElement($next));
        }
    };

    PickerUI.prototype.selectPreviousColor = function(multiSelect) {
        var $colors = this.elem.evaluating.find('.color-item');
        var $selected = $colors.filter('.selected').first();
        var $prev = $selected.length ? $selected.prev('.color-item') : $colors.last();
        
        if ($prev.length) {
            if (!multiSelect) {
                this.clearSelection();
            }
            this.toggleSelection($prev);
            $prev.focus();
            this.announceColor(this.getColorFromElement($prev));
        }
    };

    PickerUI.prototype.handlePickAction = function() {
        var selected = this.getSelected();
        
        if (selected.length === 0) {
            alert(this.messages.mustSelect);
            this.announce(this.messages.mustSelect);
            return;
        }
        
        this.pick(selected.map(c => c.id));
    };

    PickerUI.prototype.handlePassAction = function() {
        this.pass();
    };

    PickerUI.prototype.pick = function(colorIds) {
        this.state.pick(colorIds);
        this.update();
        this.updateProgress();
        this.updateTopFive();
        
        this.announce("Picked " + colorIds.length + " color" + (colorIds.length > 1 ? "s" : ""));
    };

    PickerUI.prototype.pass = function() {
        this.state.pass();
        this.update();
        this.updateProgress();
        this.updateTopFive();
        
        this.announce("Passed on current batch");
    };

    PickerUI.prototype.undo = function() {
        // Undo functionality would need history tracking in the core
        this.announce("Undo not yet implemented");
    };

    PickerUI.prototype.redo = function() {
        // Redo functionality would need history tracking in the core
        this.announce("Redo not yet implemented");
    };

    PickerUI.prototype.reset = function() {
        if (confirm(this.messages.resetWarning)) {
            this.state.reset();
            this.update();
            this.updateProgress();
            this.updateTopFive();
            this.announce("Picker reset");
        }
    };

    // ============================================
    // UI UPDATE
    // ============================================

    PickerUI.prototype.update = function() {
        var self = this;
        
        // Update evaluating colors
        this.elem.evaluating.empty();
        
        if (!this.state.evaluating || this.state.evaluating.length === 0) {
            this.displayComplete();
        } else {
            this.state.evaluating.forEach(function(color) {
                self.elem.evaluating.append(self.renderColor(color));
            });
        }
        
        // Update favorites
        this.updateFavorites();
        
        // Update buttons
        this.updateButtons();
    };

    PickerUI.prototype.displayComplete = function() {
        var $message = $('<div class="completion-message"></div>')
            .html('<h3>' + this.messages.sessionComplete + '</h3>' +
                  '<p>Completed ' + this.state.analytics.sessionComparisons + ' comparisons</p>');
        
        this.elem.evaluating.append($message);
        
        if (this.elem.finalResults) {
            this.elem.finalResults.show();
            this.updateFinalResults();
        }
        
        this.announce(this.messages.sessionComplete);
    };

    PickerUI.prototype.updateTopFive = function() {
        if (!this.elem.topFive) return;

        var allTopColors = this.state.getTopColors(100);
        var topColors = allTopColors.filter(function(c) { return c.wins > 0; }).slice(0, 5);

        this.elem.topFive.empty();

        if (topColors.length === 0) {
            this.elem.topFive.html('<p class="top-colors-empty">Start comparing colors to see your top preferences</p>');
            // Hide export section when no colors
            if (this.elem.exportSection) {
                this.elem.exportSection.hide();
            }
            return;
        }

        var self = this;
        topColors.forEach(function(color, index) {
            var $item = self.renderColor(color);
            $item.addClass('top-five-item');
            $item.prepend('<span class="top-five-rank">#' + (index + 1) + '</span>');
            self.elem.topFive.append($item);
        });

        // Show export section when there are colors
        if (this.elem.exportSection && topColors.length >= 3) {
            this.elem.exportSection.show();
        }
    };

    PickerUI.prototype.updateFinalResults = function() {
        if (!this.elem.finalResultsGrid) return;
        
        var topColors = this.state.getTopColors(10);
        this.elem.finalResultsGrid.empty();
        
        var self = this;
        topColors.forEach(function(color, index) {
            var colorName = self.getColorName(color.hex, color.hsl);
            
            var $item = $('<div class="final-result-item"></div>');
            $item.append('<div class="final-rank">#' + (index + 1) + '</div>');
            
            var $colorBlock = $('<div class="final-color-block"></div>')
                .css('background-color', color.hex);
            $item.append($colorBlock);
            
            var $info = $('<div class="final-color-info"></div>');
            $info.append('<div class="final-color-name">' + colorName.charAt(0).toUpperCase() + colorName.slice(1) + '</div>');
            $info.append('<div class="final-color-hex">' + color.hex + '</div>');
            $info.append('<div class="final-color-rating">Rating: ' + Math.round(color.eloRating) + '</div>');
            
            $item.append($info);
            self.elem.finalResultsGrid.append($item);
        });
    };

    PickerUI.prototype.updateFavorites = function() {
        var self = this;
        
        this.elem.favorites.empty();
        
        if (this.state.favorites && this.state.favorites.length > 0) {
            this.state.favorites.forEach(function(color, index) {
                var $item = self.renderColor(color);
                $item.addClass('favorite-item');
                $item.prepend('<span class="favorite-rank">#' + (index + 1) + '</span>');
                self.elem.favorites.append($item);
            });
        }
    };

    PickerUI.prototype.updateButtons = function() {
        var hasEvaluating = this.state.evaluating && this.state.evaluating.length > 0;
        
        this.elem.pick.prop('disabled', !hasEvaluating);
        this.elem.pass.prop('disabled', !hasEvaluating);
    };

    PickerUI.prototype.updateProgress = function() {
        if (!this.elem.progressBar || !this.elem.progressText) return;
        
        var progress = Math.min(100, (this.state.analytics.sessionComparisons / this.progressTarget) * 100);
        
        this.elem.progressBar.css('width', progress + '%');
        this.elem.progressText.text(
            this.state.analytics.sessionComparisons + ' / ' + this.progressTarget + ' comparisons'
        );
        
        if (this.state.analytics.sessionComparisons >= this.progressTarget) {
            this.elem.progressBar.addClass('complete');
        }
    };

    // ============================================
    // EXPORT FUNCTIONALITY
    // ============================================

    PickerUI.prototype.exportPalette = function(format) {
        var allTopColors = this.state.getTopColors(100);
        var topColors = allTopColors.filter(function(c) { return c.wins > 0; });
        
        if (topColors.length === 0) {
            alert('No colors have been selected yet. Please make some comparisons first.');
            return;
        }
        
        var exported;
        
        switch(format) {
            case 'json':
                exported = this.exportAsJSON(topColors);
                this.downloadFile('palette.json', exported, 'application/json');
                break;
            case 'css':
                exported = this.exportAsCSS(topColors);
                this.downloadFile('palette.css', exported, 'text/css');
                break;
            case 'hex':
                exported = this.exportAsHex(topColors);
                this.downloadFile('palette.txt', exported, 'text/plain');
                break;
        }
        
        this.announce("Palette exported as " + format);
    };

    PickerUI.prototype.exportAsJSON = function(colors) {
        var palette = {
            generated: new Date().toISOString(),
            colors: colors.map((c, i) => ({
                rank: i + 1,
                id: c.id,
                hex: c.hex,
                rgb: c.rgb,
                hsl: c.hsl,
                rating: Math.round(c.eloRating),
                comparisons: c.comparisons
            })),
            analytics: this.state.analytics
        };
        
        return JSON.stringify(palette, null, 2);
    };

    PickerUI.prototype.exportAsCSS = function(colors) {
        var css = '/* Color Palette - Generated ' + new Date().toISOString() + ' */\n\n';
        css += ':root {\n';
        
        colors.forEach((c, i) => {
            css += '  --color-' + (i + 1) + ': ' + c.hex + ';\n';
        });
        
        css += '}\n\n';
        css += '/* Usage: background-color: var(--color-1); */\n';
        
        return css;
    };

    PickerUI.prototype.exportAsHex = function(colors) {
        var txt = 'Color Palette - Generated ' + new Date().toISOString() + '\n\n';
        txt += 'Top Colors (by preference rating):\n\n';
        
        colors.forEach((c, i) => {
            txt += (i + 1) + '. ' + c.hex + ' (Rating: ' + Math.round(c.eloRating) + ')\n';
        });
        
        return txt;
    };

    PickerUI.prototype.downloadFile = function(filename, content, mimeType) {
        var blob = new Blob([content], { type: mimeType });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return PickerUI;
}));