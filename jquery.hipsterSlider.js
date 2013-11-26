/**
*  jquery.hipsterSlider.js
*
*  @author Norman Rusch (schorfES)
*  @repository GitHub | https://github.com/schorfES/jquery.hipsterSlider
*/

;(function( $ ){

	var
		//Constants:
		NAMESPACE = 'hipsterSlider',

		ORIENTATION_HORIZONTAL = 'horizontal',
		ORIENTATION_VERTICAL = 'vertical',

		DIRECTION_FORWARD = 1,
		DIRECTION_BACKWARD = -1,

		METHOD_APPEND = 'append',
		METHOD_PREPEND = 'prepend',
		METHOD_REPLACE = 'replace',
		METHOD_AFTER = 'insertAfter',
		METHOD_BEFORE = 'insertBefore',
		METHOD_DEFAULT = METHOD_AFTER,

		DEFAULTS = {
			tagName: 'ul',								/* default base selector */
			orientation: ORIENTATION_HORIZONTAL,		/* sets the slide-orientation */

			displayClass: 'slider-display',				/* defines the classname for the display wrapper */

			initializeMinItems: true,					/* defines if the slideshow should initialize with the number (or less) of items to display */

			itemsClasses: false,						/* defines if the items should have classnames for their current position in the slideshow */
			itemsPrevClass: 'previous',					/* defines the classname for the previous positions */
			itemsCurrentClass: 'current',				/* defines the classname for the current position */
			itemsNextClass: 'next',						/* defines the classname for the next positions */

			itemsToDisplay: 1,
			itemsToScroll: 1,							/* number of items to scroll */

			duration: 500,								/* sliding duration */

			width: undefined,							/* horizontal dimension for for the display (wrapper (overflow hidden)) */
			height: undefined,							/* vertical dimension for for the display (wrapper (overflow hidden)) */

			buttons: false,								/* activates scrolling buttons */
			buttonsWrap: false,							/* creates a wrapper div for the button-links */
			buttonsWrapClass: 'slider-buttons',			/* classname for the wrapper div */
			buttonsClass: 'slider-button',				/* classname for a button */
			buttonPrevLabel: 'previous',				/* label for the previous button */
			buttonPrevClass: 'previous',				/* classname for the previous button */
			buttonNextLabel: 'next',					/* label for the next button */
			buttonNextClass: 'next',					/* classname for the next button */
			buttonDisabledClass: 'disabled',			/* classname as indicator for a not available scrolling */
			buttonTargetSelector: undefined,			/* if set, the buttons will be placed into the defined selector */
			buttonTargetInsertionMethod: METHOD_DEFAULT,/* possible variants: append, prepend, replace, insertAfter, insertBefore. Better see the public constants such as $.hipsterSlider.METHOD_APPEND etc. */

			pager: false,								/* activates paging buttons */
			pagerWrapClass: 'pager-buttons',			/* classname for the ul list of the pagers */
			pagerClass: 'pager-button',					/* classname for the li pager entry */
			pagerSelectedClass: 'selected',				/* classname for the selected/active page */
			pagerTargetSelector: undefined,				/* if set, the pager will be placed into the defined selector */
			pagerTargetInsertionMethod: METHOD_DEFAULT,	/* possible variants: append, prepend, replace, insertAfter, insertBefore. Better see the public constants such as $.hipsterSlider.METHOD_APPEND etc. */

			siteClasses: false,							/* adds to the display's parent the active page as classname */
			siteClassesClass: 'page',					/* classname for the active page */

			biglink: false,								/* allows to open a link inside a target-element defined by classname */
			biglinkClass: 'biglink',					/* classname for the biglink target*/

			infinite: false,							/* allows unlimited scrolling in both directions */

			autoplay: false,							/* starts the slideshow automaticly */
			autoplayPause: 3000,						/* pause between each steps */
			autoplayDelay: 500,							/* defines the autoplay delay for each slider in a multiple jQuery-selection */
			autoplayDelayQueued: false,					/* defines if the autoplay delay sould be queued for each slider in a multiple jQuery-selection */
			autoplayDirection: DIRECTION_FORWARD,		/* defines the slide direction for autoplay */

			onUpdate: undefined,						/* a callback-function on each slide change */

			selectedClass: 'selected',					/* classname for a selected item */

			autoresize: false,							/* recalculates new available dimensions, when browser resizes */

			touch: false,								/* enables / disables touchfeature for mobile devices */
			touchTolerance: 20,							/* defines the tolerance in pixels to move before slide to a next position */
			touchDirectionTolerance: 45,				/* defines the tolerance in pixels until the regular touchsliding terminates when the other axis is used */

			useHardware: true							/* defines if the slider should detect css3-hardware-acceleration-features */

			/* Created by plugin inside localOptions:
				initialized: boolean that indicates if slider is initialized
				element: reference to slideshow element
				items: reference to jQuery-object with <li> items
				itemsPre: reference to jQuery-objects which are clones at the beginning of all items for infinite loop
				itemsPost: reference to jQuery-objects which are clones at the end of all items for infinite loop
				itemsAll: reference to jQuery-objects with regular-, pre- and post-items
				widthItem: width of the first item
				heightItem: height of the first item
				position: current position
				numElements: number of elements
				display: wrapper (overflow hidden) for the ul-list
				displayButtons: wrapper for buttons;
				displayPager: wrapper (ul) for pagebuttons

				buttonPrev: reference to the previous button
				buttonNext: reference to the next button
				buttonsAll: reference to the next and prvious button

				playing: set to true if animation is active

				siteClassesActive: name of the active siteClasses class

				hasHardware: indicator if css3-hardware-acceleration-features are available
				cssTransformKey: css property including renderprefix for css3 transforms
				cssTransitionKey: css property including renderprefix for css3 transitions
				cssAnimationTimeout: is the timeout-instance for css3 animations

				preInitStyles: object that stores all styles of modified DOM elements
			*/
		},

		jQueryApi,
		HipsterSliderCounter = 0,
		HipsterSlider = function($el, options) {
			this.$el = $el;
			this.options = options;
			this._init();
		}
	;


	/* Utils
	/-------------------------------------------------------------------------*/

	function setInstance(instance) {
		if(typeof instance === 'object' && typeof instance.$el === 'object') {
			instance.$el.data(NAMESPACE, instance);
		}
	}

	function getInstance(element) {
		if(typeof element === 'object') {
			return element.data(NAMESPACE);
		} else {
			return null;
		}
	}

	function removeInstance(instance) {
		if(typeof instance === 'object' && typeof instance.$el === 'object') {
			instance.$el.removeData(NAMESPACE);
		}
	}

	/* Browser Feature Detection:
	* Taken from https://gist.github.com/556448, added "noConflict"-stuff
	* @author https://gist.github.com/jackfuchs
	* @repository GitHub | https://gist.github.com/556448
	* @param p is the requested css-property
	* @param rp defines if the requested property is returned or a
	*			boolean should be the result
	* @param t overrides the target element
	*/
	function hasCssProperty(p, rp, t) {
		var
			b = (t) ? t : (document.body || document.documentElement),
			s = b.style,
			v,
			i
		;

		// No css support detected
		if(typeof s === 'undefined') { return false; }

		// Tests for standard prop
		if(typeof s[p] === 'string') { return rp ? p : true; }

		// Tests for vendor specific prop
		v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms', 'Icab'];
		p = p.charAt(0).toUpperCase() + p.substr(1);
		for(i=0; i<v.length; i++) {
			if(typeof s[v[i] + p] === 'string') { return rp ? (v[i] + p) : true; }
		}

		return rp ? undefined : false;
	}

	function getCssProperty(element, p) {
		if( element.length > 0 ) {
			p = hasCssProperty(p, true);
			element = element.get(0);
			if( typeof p === 'string' && element !== undefined ) {
				return element.style[ p ];
			}
		}
		return undefined;
	}

	function getViewportScale() {
		var
			clientWidth = $(window).width(),
			documentWidth = $(document).width()
		;

		return clientWidth / documentWidth;
	}


	/* Instance Class Properties
	/* ---------------------------------------------------------------------- */

	$.extend(HipsterSlider.prototype, {

		_init: function() {
			this.initialized = this._initElement();

			if (this.initialized) {
				this._id = HipsterSliderCounter++;
				setInstance(this);

				this._initHardware();
				this._initButtons();
				this._initPager();
				this._initBiglink();
				this._initSiteClasses();
				this._initAutoplay(this._id);
				this._initInfinite();
				this._initSelected();
				this._initAutoresize();
				this._initTouch();

				this.refreshSize();
			}
		},

		destroy: function() {
			if (this.initialized) {
				/* destruction function should be called reversed to init functions */
				this._destroyTouch();
				this._destroyAutoresize();
				this._destroyInfinite();
				this._destroyAutoplay();
				this._destroySiteClasses();
				this._destroyBiglink();
				this._destroyPager();
				this._destroyButtons();
				this._destroyHardware();
				this._destroyElement();

				removeInstance(this);
				delete(this._id);
			}
		},

		/* Element
		/* ------------------------------------------------------------------ */

		_initElement: function() {
			var
				self = this,
				tagName = this.$el.get(0).tagName.toLowerCase(),
				display,
				items,
				item
			;

			if (tagName === this.options.tagName) {
				this.options.preInitStyles = this.options.preInitStyles || {};
				this.options.preInitStyles.element = { attrStyle: this.$el.attr('style') };

				display = $('<div />').addClass( this.options.displayClass );
				items = this.$el.children();

				if (this.options.initializeMinItems === false &&
					items.length <= this.options.itemsToDisplay) {
					return false;
				}

				this.$el.css({cssFloat: 'left'});

				this.options.position = (typeof this.options.position === 'number' && this.options.position > -1) ? this.options.position : 0;
				this.options.numElements = items.length;

				this.options.preInitStyles.items = [];
				items.each( function() {
					item = $(this);
					self.options.preInitStyles.items.push({
						item: item,
						attrStyle: item.attr('style')
					});
				});

				this.options.items = items;
				this.options.itemsAll = items;

				switch( this.options.orientation ) {
					case ORIENTATION_HORIZONTAL:
						items.css('float','left');
						break;
					case ORIENTATION_VERTICAL:
						items.css('float','none');
						break;
				}

				display
					.css('overflow', 'hidden')
					.css('position', 'relative');

				this.$el
					.wrap(display)
					.css('overflow','visible');


				this.options.display = this.$el.parent();
				this.options.playing = false;

				return true;
			}
			return false;
		},

		_destroyElement: function() {
			var
				itemData,
				index
			;

			if( typeof this.options.preInitStyles.element.attrStyle === 'string' ) {
				this.$el.attr('style', this.options.preInitStyles.element.attrStyle);
			} else {
				this.$el.removeAttr('style');
			}
			this.$el.insertAfter(this.options.display);
			this.options.display.remove();


			if( this.options.itemsClasses === true ) {
				this.options.items
					.removeClass(this.options.itemsPrevClass)
					.removeClass(this.options.itemsCurrentClass)
					.removeClass(this.options.itemsNextClass);
				this.options.itemsClasses = false;
			}

			if( this.options.preInitStyles.items.length > 0 ) {
				for( index = 0; index < this.options.preInitStyles.items.length; index++ ) {
					itemData = this.options.preInitStyles.items[index];
					if( typeof itemData.attrStyle === 'string' ) {
						itemData.item.attr('style', itemData.attrStyle);
					} else {
						itemData.item.removeAttr('style');
					}
				}
			}

			delete(this.$el);
			delete(this.options.items);
			delete(this.options.itemsAll);
			delete(this.options.widthItem);
			delete(this.options.heightItem);
			delete(this.options.position);
			delete(this.options.numElements);
			delete(this.options.display);
			delete(this.options.playing);
			delete(this.options.preInitStyles);
			delete(this.options.initialized);
		},

		/* Hardware
		/* ------------------------------------------------------------------ */

		_initHardware: function() {
			if( this.options.useHardware === true ) {
				var
					css = {},
					key,
					prefixes = ['-webkit-','-moz-','-o-','-ms-','-khtml-','']
				;

				/* Build properties with prefixes and add value to test */
				for (key in prefixes) {
					css[prefixes[key]+'transform'] = 'translate3d(0,0,0)';
				}
				this.$el.css(css);

				if (hasCssProperty('transition') &&
					hasCssProperty('transform') &&
					(/translate3d/).test(getCssProperty(this.$el, 'transform'))) {
					this.options.hasHardware = true;

					/* Prefixes: 'Moz', 'Webkit', 'Khtml', 'O', 'ms', 'Icab' */
					this.options.cssTransformKey = hasCssProperty('transform',true)
												.replace(/MozT/,'-moz-t')
												.replace(/WebkitT/,'-webkit-t')
												.replace(/OT/,'-o-t')
												.replace(/msT/,'-ms-t')
												.replace('KhtmlT','-khtml-t');

					this.options.cssTransitionKey = hasCssProperty('transition',true)
												.replace(/MozT/,'-moz-t')
												.replace(/WebkitT/,'-webkit-t')
												.replace(/OT/,'-o-t')
												.replace(/msT/,'-ms-t')
												.replace('KhtmlT','-khtml-t');
				} else {
					/* Build properties with prefixes and add empty values to remove test values. */
					for(key in prefixes) {
						css[prefixes[key]+'transform'] = '';
					}
					this.$el.css(css);
				}
			}
		},

		_destroyHardware: function() {
			if( this.options.useHardware === true ) {
				if( this.options.hasHardware === true ) {
					delete(this.options.hasHardware);
					delete(this.options.cssTransformKey);
					delete(this.options.cssTransitionKey);
				}
			}
		},

		/* Buttons
		/* ------------------------------------------------------------------ */

		_initButtons: function() {
			/* Buttons must be active and there mast be at least more than one page to show */
			if (this.options.buttons === true && this.options.numElements - this.options.itemsToDisplay > 0) {
				var
					self = this,
					prevButton = $('<a href="#" class="'+ this.options.buttonsClass +' '+ this.options.buttonPrevClass +'">'+ this.options.buttonPrevLabel +'</a>'),
					nextButton = $('<a href="#" class="'+ this.options.buttonsClass +' '+ this.options.buttonNextClass +'">'+ this.options.buttonNextLabel +'</a>'),
					buttons = $([]).add(prevButton).add(nextButton),
					buttonsTarget
				;

				if( this.options.buttonsWrap ) {
					buttons = $('<div class="'+ this.options.buttonsWrapClass +'" />').append(buttons);
				}


				//Define target for buttons:
				buttonsTarget = $(this.options.buttonTargetSelector);
				buttonsTarget = (buttonsTarget.length > 0) ? buttonsTarget : this.options.display;

				//Use insertion-method:
				switch( this.options.buttonTargetInsertionMethod ) {
					case METHOD_PREPEND:
						buttonsTarget.prepend(buttons);
						break;
					case METHOD_APPEND:
						buttonsTarget.append(buttons);
						break;
					case METHOD_REPLACE:
						buttonsTarget.html(buttons);
						break;
					case METHOD_BEFORE:
						buttons.insertBefore(buttonsTarget);
						break;
					case METHOD_AFTER:
						buttons.insertAfter(buttonsTarget);
						break;
					default: // default is METHOD_AFTER
						buttons.insertAfter(buttonsTarget);
						break;
				}

				//Create Events:
				prevButton
					.bind('click.hipsterSlider', function(event) {
						event.preventDefault();
						self.slideTo(-1);
						self.stopAutoplay();
					} );


				nextButton
					.bind('click.hipsterSlider', function(event) {
						event.preventDefault();
						self.slideTo(+1);
						self.stopAutoplay();
					} );

				this.options.buttonPrev = prevButton;
				this.options.buttonNext = nextButton;
				this.options.buttonsAll = buttons;

				this.applyButtons();
			} else {
				this.options.buttons = false;
			}
		},

		_destroyButtons: function() {
			if( (this.options.buttons === true ) ) {
				this.options.buttonPrev.unbind('click.hipsterSlider');
				this.options.buttonNext.unbind('click.hipsterSlider');
				this.options.buttonsAll.remove();

				delete(this.options.buttonPrev);
				delete(this.options.buttonNext);
				delete(this.options.buttonsAll);
				this.options.buttons = false;
			}
		},

		/* Pager
		/* ------------------------------------------------------------------ */

		_initPager: function() {
			/* Pagers must be active */
			if( this.options.pager === true ) {
				var
					self = this,
					wrapPager = $('<ol class="'+ this.options.pagerWrapClass +'" />'),
					wrapPagerTarget,
					clickHandler = function(event) {
						event.preventDefault();
						var index = $(event.currentTarget).data('index');
						self.applyPosition(index);
						self.stopAutoplay();
					},
					count,
					page
				;

				//Create pagers:
				for(count = 1; count <= this.options.numElements - this.options.itemsToDisplay + 1; count++) {
					page = $('<li class="'+ this.options.pagerClass +'"><a href="#">'+ count +'</a></li>')
						.data('index', count - 1)
						.appendTo( wrapPager )
						.bind('click.hipsterSlider', clickHandler);
				}

				//Define target for pager:
				wrapPagerTarget = $(this.options.pagerTargetSelector);
				wrapPagerTarget = (wrapPagerTarget.length > 0) ? wrapPagerTarget : this.options.display;

				//Use insertion-method:
				switch (this.options.pagerTargetInsertionMethod) {
					case METHOD_PREPEND:
						wrapPagerTarget.prepend(wrapPager);
						break;
					case METHOD_APPEND:
						wrapPagerTarget.append(wrapPager);
						break;
					case METHOD_REPLACE:
						wrapPagerTarget.html(wrapPager);
						break;
					case METHOD_BEFORE:
						wrapPager.insertBefore(wrapPagerTarget);
						break;
					case METHOD_AFTER:
						wrapPager.insertAfter(wrapPagerTarget);
						break;
					default: // default is METHOD_AFTER
						wrapPager.insertAfter(wrapPagerTarget);
						break;
				}

				this.options.displayPager = wrapPager;
				this.applyPaging();

			} else {
				this.options.pager = false;
			}
		},

		_destroyPager: function() {
			if( this.options.pager === true ) {
				this.options.displayPager.find('.'+ this.options.pagerClass).unbind('click.hipsterSlider');
				this.options.displayPager.remove();

				delete(this.options.displayPager);
				this.options.pager = false;
			}
		},

		/* Biglink
		/* ------------------------------------------------------------------ */

		_initBiglink: function() {
			if( this.options.biglink === true && typeof this.options.biglinkClass === 'string' ) {
				var
					self = this,
					biglinks = this.$el.find('.'+ this.options.biglinkClass),
					biglink
				;

				if( biglinks.length > 0 ) {
					this.options.preInitStyles = this.options.preInitStyles || {};
					this.options.preInitStyles.biglinks = [];

					biglinks.each(function() {
						biglink = $(this);
						self.options.preInitStyles.biglinks.push({
							biglink: biglink,
							attrStyle: biglink.attr('style')
						});
					});


					biglinks.css('cursor','pointer')
						.bind('click.hipsterSlider', function(event) {
							event.preventDefault();
							event.stopPropagation();

							var link = $(event.currentTarget).find('a').eq(0);
							if( link.length > 0 ) {
								document.location.href = link.attr('href');
							}
						} );
				}
			}
		},

		_destroyBiglink: function() {
			if( this.options.biglink === true && typeof this.options.biglinkClass === 'string' ) {
				var
					biglinkData,
					index
				;

				for(index = 0; index < this.options.preInitStyles.biglinks.length; index++) {
					biglinkData = this.options.preInitStyles.biglinks[index];
					biglinkData.biglink.unbind('click.hipsterSlider');

					if( typeof biglinkData.attrStyle === 'string' ) {
						biglinkData.biglink.attr('style', biglinkData.attrStyle);
					} else {
						biglinkData.biglink.removeAttr('style');
					}
				}

				delete(this.options.preInitStyles.biglinks);
			}
		},

		/* Siteclasses
		/* ------------------------------------------------------------------ */

		_initSiteClasses: function() {
			this.options.siteClassesActive = this.options.siteClassesClass + (this.options.position + 1);
			this.applySiteClasses();
		},

		_destroySiteClasses: function() {
			if( this.options.siteClasses === true ) {
				this.options.display.parent().removeClass( this.options.siteClassesActive );
				this.options.siteClassesActive = undefined;
				delete(this.options.siteClassesActive);
			}
		},

		/* Autoplay
		/* ------------------------------------------------------------------ */

		_initAutoplay: function(index) {
			var self = this;
			/* Autoplay must be active and there mast be at least more than one page to show */
			if( this.options.autoplay === true && this.options.numElements - this.options.itemsToDisplay > 0 ) {
				index = (this.options.autoplayDelayQueued) ? index : 1;
				index = index ? index : 0;

				window.setTimeout( function() {
					self.autoplay();
				}, this.options.autoplayPause + (index * this.options.autoplayDelay) );
			} else {
				this.options.autoplay = false;
			}
		},

		_destroyAutoplay: function() {
			if( this.options.autoplay === true ) {
				this.stopAutoplay(this.options);
			}
		},

		/* Infinite
		/* ------------------------------------------------------------------ */

		_initInfinite: function() {
			/* Infinite must be active and there mast be at least more than one page to show */
			if( this.options.infinite === true && this.options.numElements - this.options.itemsToDisplay > 0 ) {
				var
					preItem = this.options.items.eq(0),
					postItem = this.options.items.eq(this.options.numElements - 1),
					counter,
					preCloneIndex,
					preClone,
					postCloneIndex,
					postClone,
					cssFloat
				;

				for(counter = 0; counter < this.options.itemsToDisplay; counter++) {
					preCloneIndex = this.options.numElements - 1 - counter;
					preClone = this.options.items.eq(preCloneIndex).clone();

					postCloneIndex = counter;
					postClone = this.options.items.eq(postCloneIndex).clone();

					cssFloat = (this.options.orientation === ORIENTATION_HORIZONTAL) ? 'left' : 'none';
					postClone.css({cssFloat: cssFloat}).addClass('clone post').insertAfter(postItem);
					preClone.css({cssFloat: cssFloat}).addClass('clone pre').insertBefore(preItem);

					preItem = preClone;
					postItem = postClone;

					/* Store all clones */
					if( typeof this.options.itemsPre === 'undefined' ) {
						this.options.itemsPre = preClone;
						this.options.itemsPost = postClone;
					} else {
						this.options.itemsPre = this.options.itemsPre.add(preClone);
						this.options.itemsPost = this.options.itemsPost.add(postClone);
					}
				}

				/* Store all new pre and postitems */
				if( typeof this.options.itemsPre !== 'undefined' ) {
					this.options.itemsAll = this.options.itemsAll.add(this.options.itemsPre).add(this.options.itemsPost);
				}

			} else {
				this.options.infinite = false;
			}
		},

		_destroyInfinite: function() {
			if( this.options.infinite === true ) {
				this.options.itemsPre.remove();
				this.options.itemsPost.remove();

				this.options.itemsPre = undefined;
				this.options.itemsPost = undefined;

				delete(this.options.itemsPre);
				delete(this.options.itemsPost);

				this.options.infinite = false;
			}
		},

		/* Selected
		/* ------------------------------------------------------------------ */

		_initSelected: function() {
			var selected = this.options.items.filter('.'+ this.options.selectedClass);
			if( selected.length > 0 ) {
				this.options.position = this.options.items.index( selected.get(0) );
			}
		},

		/* Autoresize
		/* ------------------------------------------------------------------ */

		_initAutoresize: function() {
			if( this.options.autoresize === true ) {
				var self = this;
				$(window).bind('resize.hipsterSlider', function() {
					self.refreshSize();
				});
			}
		},

		_destroyAutoresize: function() {
			if( this.options.autoresize === true ) {
				$(window).unbind('resize.hipsterSlider');
				this.options.autoresize = false;
			}
		},

		/* Touch
		/* ------------------------------------------------------------------ */

		_initTouch: function() {
			if( this.options.touch === true ) {
				var
					self = this,
					doc = $(document),
					startX, startY,
					pos, posX, posY,
					diffX, diffY, diffAbs,
					direction, baseEvent, target,
					isToleranceReched,

					onMouseDown,
					onMouseMove,
					onMouseLeave
				;

				//Prevent Image and link dragging:
				this.$el.find('img, a').bind('dragstart.hipsterSlider', function(event) {
					event.preventDefault();
				});

				onMouseDown = function(event) {
					if( !self.options.playing ) {
						baseEvent = (event.originalEvent.touches) ? event.originalEvent.touches[0] : event.originalEvent;
						target = $(event.currentTarget);

						pos = self._getPosition();
						posX = pos.left;
						posY = pos.top;
						startX = baseEvent.pageX;
						startY = baseEvent.pageY;
						diffX = 0;
						diffY = 0;
						isToleranceReched = false;

						target.bind('mousemove.hipsterSlider touchmove.hipsterSlider', onMouseMove);
						self.options.itemsAll.unbind('mousedown.hipsterSlider touchstart.hipsterSlider', onMouseDown);
					}
				};

				onMouseMove = function(event) {
					var
						tolerance = self.options.touchDirectionTolerance * (2 - getViewportScale()),
						reachedHorizontalTolerance,
						reachedVerticalTolerance
					;

					self.options.autoplay = false;
					baseEvent = (event.originalEvent.touches) ? event.originalEvent.touches[0] : event.originalEvent;

					diffX = baseEvent.pageX - startX;
					diffY = baseEvent.pageY - startY;

					reachedHorizontalTolerance = (self.options.orientation === ORIENTATION_HORIZONTAL && Math.abs(diffX) < tolerance);
					reachedVerticalTolerance = (self.options.orientation === ORIENTATION_VERTICAL && Math.abs(diffY) < tolerance);

					if( !isToleranceReched && (reachedHorizontalTolerance || reachedVerticalTolerance)) {
						return;
					} else if ( !isToleranceReched ) {
						isToleranceReched = true;

						doc.bind('mouseup.hipsterSlider touchend.hipsterSlider', onMouseLeave);
					}

					event.preventDefault();
					event.stopPropagation();

					switch(self.options.orientation) {
						case ORIENTATION_HORIZONTAL:
							self._setPosition({left: posX + diffX, duration: 75}, true);
							break;
						case ORIENTATION_VERTICAL:
							self._setPosition({top: posY + diffY, duration: 75}, true);
							break;
					}

				};

				onMouseLeave = function(/* event */) {
					diffAbs = Math.abs( ( self.options.orientation === ORIENTATION_HORIZONTAL ) ? diffX : diffY );
					direction = ( self.options.orientation === ORIENTATION_HORIZONTAL ) ? -diffX / diffAbs : -diffY / diffAbs;

					if( diffAbs > self.options.touchTolerance ) {
						self.options.playing = false;
						self.slideTo(direction);
					} else {
						self.options.playing = false;
						self.slideTo(0);
					}

					target.unbind('mousemove.hipsterSlider touchmove.hipsterSlider', onMouseMove);
					doc.unbind('mouseup.hipsterSlider touchend.hipsterSlider', onMouseLeave);
					self.options.itemsAll.bind('mousedown.hipsterSlider touchstart.hipsterSlider', onMouseDown);

					target = $();
				};


				this.options.itemsAll.bind('mousedown.hipsterSlider touchstart.hipsterSlider', onMouseDown);
			}
		},

		_destroyTouch: function() {
			if( this.options.touch === true ) {
				this.options.itemsAll
					.unbind('mousedown.hipsterSlider')
					.unbind('mousemove.hipsterSlider')
					.unbind('mouseup.hipsterSlider')
					.unbind('touchstart.hipsterSlider')
					.unbind('touchmove.hipsterSlider')
					.unbind('touchend.hipsterSlider');

				$(document)
					.unbind('mouseup.hipsterSlider')
					.unbind('touchend.hipsterSlider');

				this.$el.find('img, a')
					.unbind('dragstart.hipsterSlider');

				this.options.touch = false;
			}
		},

		/* Controls
		/* ------------------------------------------------------------------ */

		slideTo: function(direction) {
			if (this.initialized === true && !this.options.playing ) {
				direction = direction * this.options.itemsToScroll;
				this.options.position = this.options.position + direction;
				this.applyPosition();
			}
		},

		applyPosition: function(position, animated) {
			animated = (typeof animated === 'undefined' || animated);

			var
				self = this,
				newPositionX = 0,
				newPositionY = 0,
				infiniteOffset = 0
			;

			if( typeof position !== 'undefined' ) {
				this.options.position = position;
			}

			if( this.options.infinite === false ) {
				if( this.options.position < 0 ) {
					this.options.position = 0;
				} else if( this.options.position > this.options.numElements - this.options.itemsToDisplay ) {
					this.options.position = this.options.numElements - this.options.itemsToDisplay;
				}
			} else {
				//Detect Offset for infinite loops:
				infiniteOffset = (( this.options.orientation === ORIENTATION_HORIZONTAL) ? this.options.widthItem : this.options.heightItem) * this.options.itemsToDisplay * -1;
			}

			//Calculate new Positions:
			if( this.options.orientation === ORIENTATION_HORIZONTAL ) {
				newPositionX = (this.options.position * this.options.widthItem * -1) + infiniteOffset;
			} else {
				newPositionY = (this.options.position * this.options.heightItem * -1) + infiniteOffset;
			}

			//Set New Positions:
			this._setPosition({
				left: newPositionX,
				top: newPositionY,
				duration: this.options.duration
			}, animated, function() {
				if( self.options.infinite === true ) {
					if( self.options.position < -(self.options.itemsToDisplay - self.options.itemsToScroll) ) {
						self.applyPosition(self.options.numElements - self.options.itemsToDisplay, false);
					}
					if( self.options.position >= self.options.numElements ) {
						self.applyPosition(0, false);
					}

				}
				self.applyPaging();
			});

			//Update features:
			this.applyButtons();
			this.applySiteClasses();
			this.applyItemClasses();

			if( !animated ) {
				this.applyPaging();
			}

			if( typeof this.options.onUpdate === 'function' ) {
				this.options.onUpdate(this.$el);
			}
		},

		autoplay: function() {
			if( this.options.autoplay === true ) {
				var self = this;
				this.slideTo(this.options.autoplayDirection);
				window.setTimeout( function() {
					self.autoplay();
				}, this.options.autoplayPause);
			}
		},

		stopAutoplay: function() {
			this.options.autoplay = false;
		},

		applyButtons: function() {
			if( this.options.buttons === true ) {
				if( typeof this.options.buttonPrev !== 'undefined' ) {
					this.options.buttonPrev.removeClass( this.options.buttonDisabledClass );
					if( this.options.position <= 0 && this.options.infinite === false ) {
						this.options.buttonPrev.addClass(this.options.buttonDisabledClass);
					}
				}

				if( typeof this.options.buttonNext !== 'undefined' ) {
					this.options.buttonNext.removeClass( this.options.buttonDisabledClass );
					if( this.options.position >= this.options.numElements - this.options.itemsToDisplay && this.options.infinite === false ) {
						this.options.buttonNext.addClass(this.options.buttonDisabledClass);
					}
				}
			}
		},

		applyPaging: function() {
			if(this.options.pager === true && this.options.displayPager) {
				this.options.displayPager
					.children('.'+ this.options.pagerSelectedClass)
					.removeClass(this.options.pagerSelectedClass);

				this.options.displayPager
					.children()
					.eq(this.options.position)
					.addClass(this.options.pagerSelectedClass);
			}
		},

		applySiteClasses: function() {
			if( this.options.siteClasses === true ) {
				this.options.display
					.parent()
					.removeClass(this.options.siteClassesActive);

				this.options.siteClassesActive = this.options.siteClassesClass + (this.options.position + 1);

				this.options.display
					.parent()
					.addClass(this.options.siteClassesActive);
			}
		},

		applyItemClasses: function() {
			if(this.options.itemsClasses === true) {
				var
					self = this,
					item,
					from,
					to
				;

				//General items:
				this.options.items.each( function(index) {
					item = $(this);
					if( index < self.options.position && !item.hasClass( self.options.itemsPrevClass ) ) {
						item.removeClass( self.options.itemsCurrentClass )
							.removeClass( self.options.itemsNextClass )
							.addClass( self.options.itemsPrevClass );
					} else if( index === self.options.position && !item.hasClass( self.options.itemsCurrentClass ) ) {
						item.removeClass( self.options.itemsPrevClass )
							.removeClass( self.options.itemsNextClass )
							.addClass( self.options.itemsCurrentClass );
					} else if( index > self.options.position && !item.hasClass( self.options.itemsNextClass ) ) {
						item.removeClass( self.options.itemsCurrentClass )
							.removeClass( self.options.itemsPrevClass )
							.addClass( self.options.itemsNextClass );
					}
				} );


				//Pre and Post items:
				if( this.options.infinite === true ) {
					//Preitems:
					if( this.options.position < -(this.options.itemsToDisplay - this.options.itemsToScroll) ) {
						from = this.options.numElements - this.options.itemsToDisplay;
						to = this.options.numElements;
						if( from >= 0 && from < this.options.numElements ) {
							this.options.items.slice( from, to )
								.removeClass( this.options.itemsPrevClass )
								.removeClass( this.options.itemsNextClass )
								.addClass( this.options.itemsCurrentClass );
						}

						this.options.itemsPre
							.removeClass( this.options.itemsPrevClass )
							.addClass( this.options.itemsCurrentClass );
					} else {
						this.options.itemsPre
						.removeClass(this.options.itemsCurrentClass)
						.addClass(this.options.itemsPrevClass);
					}

					//Postitems:
					if( this.options.position >= this.options.numElements ) {
						from = 0;
						to = this.options.itemsToDisplay;
						if( to < this.options.numElements ) {
							this.options.items.slice( from, to )
								.removeClass(this.options.itemsPrevClass)
								.removeClass(this.options.itemsNextClass)
								.addClass(this.options.itemsCurrentClass);
						}
						this.options.itemsPost
							.removeClass(this.options.itemsNextClass)
							.addClass(this.options.itemsCurrentClass);
					} else {
						this.options.itemsPost
							.removeClass(this.options.itemsCurrentClass)
							.addClass(this.options.itemsNextClass);
					}
				}
			}
		},

		refreshSize: function() {
			var
				width = 0,
				height = 0
			;

			//Calculate width:
			width = this.options.display.parent().width();

			if( this.options.orientation === ORIENTATION_HORIZONTAL ) {
				this.options.itemsAll.width((this.options.width || width) / this.options.itemsToDisplay);
				this.$el.width(this.options.itemsAll.length * ((this.options.width || width) / this.options.itemsToDisplay));
			} else {
				this.options.itemsAll.width(this.options.width || width);
				this.$el.width(this.options.itemsAll.length * (this.options.width || width));
			}

			//Reset height forvertical elements:
			if( this.options.orientation === ORIENTATION_VERTICAL ) {
				this.options.itemsAll.height('auto');
			}

			//Calculate height:
			this.options.itemsAll.each(function() {
				height = Math.max($(this).outerHeight(true), height);
			});

			//Store and apply values:
			if( this.options.orientation === ORIENTATION_HORIZONTAL ) {
				this.options.widthItem = (this.options.width || width) / this.options.itemsToDisplay;
				this.options.heightItem = this.options.height || height;
				this.options.display
							.width(this.options.width || width)
							.height(this.options.height || height);
			} else {
				this.options.itemsAll.height(this.options.height || height);
				this.options.widthItem = this.options.width || width;
				this.options.heightItem = this.options.height || height;
				this.options.display
							.width(this.options.width || width)
							.height((this.options.height || height * this.options.itemsToDisplay));
			}

			this.applyPosition(undefined, false);
		},

		_getPosition: function() {
			if(this.options.hasHardware === true) {
				var
					matrix = this.$el.css(this.options.cssTransformKey),
					isMatrix3d = matrix.indexOf('matrix3d') > -1,
					left,
					top
				;

				matrix = matrix
					.replace(/matrix3d/,'matrix')
					.match(/(?:[-\d(\.(\d)*)?]+[\s,]*)+/)[0]
					.split(',');

				if( isMatrix3d ) {
					left = parseFloat(matrix[12]) || 0;
					top = parseFloat(matrix[13]) || 0;
				} else {
					left = parseFloat(matrix[4]) || 0;
					top = parseFloat(matrix[5]) || 0;
				}

				return {
					left: left,
					top: top
				};
			} else {
				return {
					left: parseFloat(this.$el.css('margin-left').replace(/px/, '')) || 0,
					top: parseFloat(this.$el.css('margin-top').replace(/px/, '')) || 0
				};
			}
		},

		_setPosition: function(properties, animated, callback) {
			var
				self = this,
				cssProperties = {},
				currentPosition = this._getPosition(),
				onCallback = function() {
					self.options.playing = false;
					if( typeof callback === 'function' ) {
						callback();
					}
				}
			;

			// Check if there is nothing to change:
			if( Math.floor(currentPosition.left) === Math.floor(properties.left) &&
				Math.floor(currentPosition.top) === Math.floor(properties.top) ) {
				return;
			}

			if( properties.duration === undefined ) {
				properties.duration = this.options.duration;
			}

			if( this.options.hasHardware === true ) {
				//Animate:
				if( animated === true ) {
					this.options.playing = true;
					this.$el
						.css(this.options.cssTransitionKey, this.options.cssTransformKey +' '+ (properties.duration / 1000) +'s ease 0s')
						.one('webkitTransitionEnd mozTransitionEnd msTransitionEnd oTransitionEnd transitionend', onCallback);
				} else {
					this.$el
						.css(this.options.cssTransitionKey, this.options.cssTransformKey +' 0s ease 0s');
					onCallback();
				}

				this.$el
					.css(this.options.cssTransformKey, 'translate3d('+ (properties.left || 0) +'px,'+ (properties.top || 0) +'px,0)');
			} else {
				cssProperties.marginLeft = properties.left || 0;
				cssProperties.marginTop = properties.top || 0;

				//Animate:
				if( animated === true ) {
					this.options.playing = true;
					this.$el.stop().animate(cssProperties, properties.duration, onCallback);
				} else {
					this.$el.stop().css(cssProperties);
					onCallback();
				}
			}
		}

	});


	/* jQuery Plugin API
	/* ---------------------------------------------------------------------- */

	jQueryApi = {
		init: function( options ) {
			return $(this).each( function() {
				new HipsterSlider(
					$(this),
					$.extend({}, DEFAULTS, options)
				);
			});
		},

		next: function() {
			return $(this).each(function() {
				var instance = getInstance($(this));
				if(typeof instance === 'object') {
					instance.slideTo(+1);
				}
			});
		},

		prev: function() {
			return $(this).each(function() {
				var instance = getInstance($(this));
				if(typeof instance === 'object') {
					instance.slideTo(-1);
				}
			});
		},

		page: function(index) {
			var instance;
			if( typeof index === 'number' ) {
				return $(this).each(function() {
					instance = getInstance($(this));
					if(typeof instance === 'object') {
						instance.applyPosition(index);
					}
				});
			} else {
				instance = getInstance($(this));
				if(typeof instance === 'object') {
					return instance.options.position;
				} else {
					return -1;
				}
			}
		},

		stop: function() {
			return $(this).each(function() {
				var instance = getInstance($(this));
				if(typeof instance === 'object') {
					instance.stopAutoplay();
				}
			});
		},

		getPosition: function() {
			var instance = getInstance($(this));
			if(typeof instance === 'object') {
				return instance.options.position;
			} else {
				return -1;
			}
		},

		options: function() {
			var instance = getInstance($(this));
			if(typeof instance === 'object') {
				return instance.options;
			} else {
				return null;
			}
		},

		itemsToDisplay: function(value) {
			if( typeof value === 'number' ) {
				return $(this).each(function() {
					var
						instance = getInstance($(this)),
						options = instance.options
					;

					if( value !== options.itemsToDisplay &&
						value > 0 && value <= options.numElements ) {

						if( options.infinite ) {
							//TODO: add possebility to change value for infinite mode:
							throw new Error('You can only set "itemsToDisplay" when the option "infinite" is disabled.');
						}

						options.itemsToDisplay = value;
						instance.refreshSize();

						//Update pager:
						if( options.pager ) {
							instance._destroyPager();
							options.pager = true; //destroyPager resets pageroption...
							instance._initPager();
						}
					}
				});
			} else {
				return $(this).data('sliderOptions').itemsToDisplay;
			}
		},

		destroy: function() {
			return $(this).each(function() {
				var instance = getInstance($(this));
				if(typeof instance === 'object') {
					instance.destroy();
				}
			});
		},

		refreshSize: function() {
			var instance = getInstance($(this));
			if(typeof instance === 'object') {
				instance.refreshSize();
			}
		}
	};


	/* Directing calls into jQuery Plugin API
	/-------------------------------------------------------------------------*/
	$.fn.hipsterSlider = function( method ) {
		if ( jQueryApi[method] ) {
			return jQueryApi[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || method === undefined ) {
			return jQueryApi.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.hipsterSlider' );
		}
	};


	/* Public Constants & Values
	/-------------------------------------------------------------------------*/
	$.hipsterSlider = $.hipsterSlider || {};

	$.hipsterSlider.Class = HipsterSlider;

	$.hipsterSlider.HORIZONTAL = ORIENTATION_HORIZONTAL;
	$.hipsterSlider.VERTICAL = ORIENTATION_VERTICAL;

	$.hipsterSlider.FORWARD = DIRECTION_FORWARD;
	$.hipsterSlider.BACKWARD = DIRECTION_BACKWARD;

	$.hipsterSlider.METHOD_APPEND = METHOD_APPEND;
	$.hipsterSlider.METHOD_PREPEND = METHOD_PREPEND;
	$.hipsterSlider.METHOD_REPLACE = METHOD_REPLACE;
	$.hipsterSlider.METHOD_AFTER = METHOD_AFTER;
	$.hipsterSlider.METHOD_BEFORE = METHOD_BEFORE;
	$.hipsterSlider.METHOD_DEFAULT = METHOD_DEFAULT;

	$.hipsterSlider.DEFAULTS = DEFAULTS;

})( jQuery );
