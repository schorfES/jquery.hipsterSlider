/**
*  jquery.hipsterSlider.js
*
*  @author Norman Rusch (schorfES)
*  @repository GitHub | https://github.com/schorfES/jquery.hipsterSlider
*/

(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node/CommonJS
		module.exports = factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

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
			buttonTemplate: function(data) {			/* default function which contains a button template */
				return '<a href="#" class="'+ data.buttonClass +' '+ data.directionClass +'">'+ data.label +'</a>';
			},
			buttonsWrapTemplate: function(data) {		/* default function which contains a buttons wrapper template */
				return '<div class="'+ data.buttonsWrapClass +'" />';
			},

			pager: false,								/* activates paging buttons */
			pagerWrapClass: 'pager-buttons',			/* classname for the ul list of the pagers */
			pagerClass: 'pager-button',					/* classname for the li pager entry */
			pagerSelectedClass: 'selected',				/* classname for the selected/active page */
			pagerTargetSelector: undefined,				/* if set, the pager will be placed into the defined selector */
			pagerTargetInsertionMethod: METHOD_DEFAULT,	/* possible variants: append, prepend, replace, insertAfter, insertBefore. Better see the public constants such as $.hipsterSlider.METHOD_APPEND etc. */
			pagerTemplate: function(data) {				/* default function which contains a pager item template */
				return '<li class="'+ data.pagerClass +'"><a href="#">'+ data.count +'</a></li>';
			},
			pagerWrapTemplate: function(data) {			/* default function which contains the pager wrapper template */
				return '<ol class="'+ data.pagerWrapClass +'" />';
			},

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
		},

		$document = $(document),
		$window = $(window),

		jQueryApi,
		HipsterSliderCounter = 0,
		HipsterSliderRegistry = {},
		HipsterSlider = function($el, options) {
			this.$el = $el;
			this._options = options;
			this._init();
		}
	;


	/* Utils
	/-------------------------------------------------------------------------*/

	function setInstance(instance) {
		if (typeof instance === 'object' && typeof instance.$el === 'object') {
			instance.$el.data(NAMESPACE, instance);
			HipsterSliderRegistry[NAMESPACE +'_'+ instance.getId()] = instance;
		}
	}

	function getInstance(element) {
		if (typeof element === 'object') {
			return element.data(NAMESPACE);
		} else {
			return null;
		}
	}

	function removeInstance(instance) {
		if (typeof instance === 'object' && typeof instance.$el === 'object') {
			instance.$el.removeData(NAMESPACE);
			HipsterSliderRegistry[NAMESPACE +'_'+ instance.getId()] = undefined;
			delete(HipsterSliderRegistry[NAMESPACE +'_'+ instance.getId()]);
		}
	}

	/* Browser Feature Detection:
	/* Taken from https://gist.github.com/556448, added "noConflict"-stuff
	/*
	/* @author		https://gist.github.com/jackfuchs
	/* @repository	GitHub | https://gist.github.com/556448
	/* @param p		is the requested css-property
	/* @param rp	defines if the requested property is returned or a
	/*				boolean should be the result
	/* @param t		overrides the target element */
	function hasCssProperty(p, rp, t) {
		var
			b = (t) ? t : (document.body || document.documentElement),
			s = b.style,
			v,
			i
		;

		// No css support detected
		if (typeof s === 'undefined') {
			return false;
		}

		// Tests for standard prop
		if (typeof s[p] === 'string') {
			return rp ? p : true;
		}

		// Tests for vendor specific prop
		v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms', 'Icab'];
		p = p.charAt(0).toUpperCase() + p.substr(1);
		for (i = 0; i < v.length; i++) {
			if (typeof s[v[i] + p] === 'string') {
				return rp ? (v[i] + p) : true;
			}
		}

		return rp ? undefined : false;
	}

	function getCssProperty(element, p) {
		if (element.length > 0) {
			p = hasCssProperty(p, true);
			element = element.get(0);
			if (typeof p === 'string' && element !== undefined) {
				return element.style[ p ];
			}
		}
		return undefined;
	}

	function getViewportScale() {
		var
			clientWidth = $window.width(),
			documentWidth = $document.width()
		;

		return clientWidth / documentWidth;
	}

	/* Does the same as $.proxy(). To support older versions of jQuery this
	/* implementation is used in this plugin.
	/*
	/* @param method	function which sould called in given scope
	/* @param scope		scope in which the function is called
	/* @return			a proxy function */
	function proxy(method, scope) {
		return function() {
			if (typeof method === 'function') {
				method.apply(scope, arguments);
			}
		};
	}


	/* Instance Class Properties
	/* ---------------------------------------------------------------------- */

	$.extend(HipsterSlider.prototype, {

		/* Created by plugin inside instance:
		/* ------------------------------------------------------------------
		/*
		/* initialized: boolean that indicates if slider is initialized
		/*
		/* _items: reference to jQuery-object with <li> items
		/* _itemsPre: reference to jQuery-objects which are clones at the beginning of all items for infinite loop
		/* _itemsPost: reference to jQuery-objects which are clones at the end of all items for infinite loop
		/* _itemsAll: reference to jQuery-objects with regular-, pre- and post-items
		/* _itemWidth: width of the first item
		/* _itemHeight: height of the first item
		/*
		/* _position: current position
		/* _numElements: number of elements
		/* _display: wrapper (overflow hidden) for the element
		/* _displayPager: wrapper (<ol />) for pagebuttons
		/*
		/* _buttonPrev: reference to the previous button
		/* _buttonNext: reference to the next button
		/* _buttonsAll: reference to the next and prvious button
		/*
		/* _playing: set to true if animation is active
		/*
		/* _siteClassesActive: name of the active siteClasses class
		/*
		/* _hasHardware: indicator if css3-hardware-acceleration-features are available
		/* _cssTransformKey: css property including renderprefix for css3 transforms
		/* _cssTransitionKey: css property including renderprefix for css3 transitions
		/*
		/* _preInitStyles: object that stores all styles of modified DOM elements
		/*
		/* _touchData: object which stores the current touch actions
		/* ------------------------------------------------------------------ */

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
				removeInstance(this);

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

				this._options = undefined;
				this._id = undefined;
				delete(this._options);
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

			if (tagName === this._options.tagName) {
				this._preInitStyles = this._preInitStyles || {};
				this._preInitStyles.element = {
					attrStyle: this.$el.attr('style')
				};

				display = $('<div />').addClass(this._options.displayClass);
				items = this.$el.children();

				if (this._options.initializeMinItems &&
					items.length <= this._options.itemsToDisplay) {
					return false;
				}

				this.$el.css({cssFloat: 'left'});

				this._position = (typeof this._position === 'number' && this._position > -1) ? this._position : 0;
				this._numElements = items.length;

				this._preInitStyles.items = [];
				items.each(function() {
					item = $(this);
					self._preInitStyles.items.push({
						item: item,
						attrStyle: item.attr('style')
					});
				});

				this._items = items;
				this._itemsAll = items;

				switch (this._options.orientation) {
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


				this._display = this.$el.parent();
				this._playing = false;

				return true;
			}
			return false;
		},

		_destroyElement: function() {
			var
				itemData,
				index
			;

			if (typeof this._preInitStyles.element.attrStyle === 'string') {
				this.$el.attr('style', this._preInitStyles.element.attrStyle);
			} else {
				this.$el.removeAttr('style');
			}
			this.$el.insertAfter(this._display);
			this._display.remove();


			if (this._options.itemsClasses) {
				this._items
					.removeClass(this._options.itemsPrevClass)
					.removeClass(this._options.itemsCurrentClass)
					.removeClass(this._options.itemsNextClass);
				this._options.itemsClasses = false;
			}

			if (this._preInitStyles.items.length > 0) {
				for (index = 0; index < this._preInitStyles.items.length; index++) {
					itemData = this._preInitStyles.items[index];
					if (typeof itemData.attrStyle === 'string') {
						itemData.item.attr('style', itemData.attrStyle);
					} else {
						itemData.item.removeAttr('style');
					}
				}
			}

			delete(this.$el);
			delete(this._items);
			delete(this._itemsAll);
			delete(this._itemWidth);
			delete(this._itemHeight);
			delete(this._position);
			delete(this._numElements);
			delete(this._display);
			delete(this._playing);
			delete(this._preInitStyles);
			delete(this.initialized);
		},

		/* Hardware
		/* ------------------------------------------------------------------ */

		_initHardware: function() {
			if (this._options.useHardware) {
				var
					css = {},
					key,
					prefixes = [
						'-webkit-',
						'-khtml-',
						'-moz-',
						'-ms-',
						'-o-',
						''
					]
				;

				/* Build properties with prefixes and add value to test */
				for (key in prefixes) {
					css[prefixes[key] +'transform'] = 'translate3d(0,0,0)';
				}
				this.$el.css(css);

				if (hasCssProperty('transition') &&
					hasCssProperty('transform') &&
					(/translate3d/).test(getCssProperty(this.$el, 'transform'))) {
					this._hasHardware = true;

					/* Prefixes: 'Moz', 'Webkit', 'Khtml', 'O', 'ms', 'Icab' */
					this._cssTransformKey = hasCssProperty('transform',true)
												.replace(/MozT/,'-moz-t')
												.replace(/WebkitT/,'-webkit-t')
												.replace(/OT/,'-o-t')
												.replace(/msT/,'-ms-t')
												.replace('KhtmlT','-khtml-t');

					this._cssTransitionKey = hasCssProperty('transition',true)
												.replace(/MozT/,'-moz-t')
												.replace(/WebkitT/,'-webkit-t')
												.replace(/OT/,'-o-t')
												.replace(/msT/,'-ms-t')
												.replace('KhtmlT','-khtml-t');
				} else {
					/* Build properties with prefixes and add empty values to remove test values. */
					for (key in prefixes) {
						css[prefixes[key] +'transform'] = '';
					}
					this.$el.css(css);
				}
			}
		},

		_destroyHardware: function() {
			if (this._options.useHardware) {
				if (this._hasHardware) {
					delete(this._hasHardware);
					delete(this._cssTransformKey);
					delete(this._cssTransitionKey);
				}
			}
		},

		/* Buttons
		/*
		/* Feature for the next and previous button to slide to the next
		/* or previous slider item.
		/* ------------------------------------------------------------------ */

		_initButtons: function() {
			/* Buttons must be active and there mast be at least more than one page to show */
			if (this._options.buttons && this._numElements - this._options.itemsToDisplay > 0) {
				var
					prevButton,
					nextButton,
					buttons,
					buttonsTarget
				;

				//Render Buttons:
				nextButton = $(this._options.buttonTemplate({
					buttonClass: this._options.buttonsClass,
					directionClass: this._options.buttonNextClass,
					label: this._options.buttonNextLabel
				}));

				prevButton = $(this._options.buttonTemplate({
					buttonClass: this._options.buttonsClass,
					directionClass: this._options.buttonPrevClass,
					label: this._options.buttonPrevLabel
				}));

				buttons = $([]).add(prevButton).add(nextButton);

				if (this._options.buttonsWrap) {
					buttons = $(this._options.buttonsWrapTemplate({
						buttonsWrapClass: this._options.buttonsWrapClass
					})).append(buttons);
				}

				//Define target for buttons:
				buttonsTarget = $(this._options.buttonTargetSelector);
				buttonsTarget = (buttonsTarget.length > 0) ? buttonsTarget : this._display;

				//Use insertion-method:
				switch (this._options.buttonTargetInsertionMethod) {
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
				nextButton.bind('click.'+ NAMESPACE, proxy(this._onClickNext, this));
				prevButton.bind('click.'+ NAMESPACE, proxy(this._onClickPrevious, this));

				this._buttonPrev = prevButton;
				this._buttonNext = nextButton;
				this._buttonsAll = buttons;

				this._updateButtons();
			} else {
				this._options.buttons = false;
			}
		},

		_updateButtons: function() {
			if (this._options.buttons) {
				if (typeof this._buttonPrev !== 'undefined') {
					this._buttonPrev.removeClass(this._options.buttonDisabledClass);
					if (this._position <= 0 && !this._options.infinite) {
						this._buttonPrev.addClass(this._options.buttonDisabledClass);
					}
				}

				if (typeof this._buttonNext !== 'undefined') {
					this._buttonNext.removeClass(this._options.buttonDisabledClass);
					if (this._position >= this._numElements - this._options.itemsToDisplay && !this._options.infinite) {
						this._buttonNext.addClass(this._options.buttonDisabledClass);
					}
				}
			}
		},

		_destroyButtons: function() {
			if (this._options.buttons) {
				this._buttonPrev.unbind('click.'+ NAMESPACE);
				this._buttonNext.unbind('click.'+ NAMESPACE);
				this._buttonsAll.remove();

				delete(this._buttonPrev);
				delete(this._buttonNext);
				delete(this._buttonsAll);
				this._options.buttons = false;
			}
		},

		_onClickNext: function(event) {
			event.preventDefault();
			this.slideTo(+1);
			this.autoplayStop();
		},

		_onClickPrevious: function(event) {
			event.preventDefault();
			this.slideTo(-1);
			this.autoplayStop();
		},

		/* Pager
		/* ------------------------------------------------------------------ */

		_initPager: function() {
			/* Pagers must be active */
			if (this._options.pager) {
				var
					wrapPager,
					wrapPagerTarget,
					count,
					page
				;

				//Create pagers:
				wrapPager = $(this._options.pagerWrapTemplate({
					pagerWrapClass: this._options.pagerWrapClass
				}));

				for (count = 1; count <= this._numElements - this._options.itemsToDisplay + 1; count++) {
					page = $(this._options.pagerTemplate({
						pagerClass: this._options.pagerClass,
						count: count
					}));

					page
						.data('index', count - 1)
						.appendTo(wrapPager)
						.bind('click.'+ NAMESPACE, proxy(this._onClickPager, this));
				}

				//Define target for pager:
				wrapPagerTarget = $(this._options.pagerTargetSelector);
				if (wrapPagerTarget.length <= 0) {
					wrapPagerTarget = this._display;
				}

				//Use insertion-method:
				switch (this._options.pagerTargetInsertionMethod) {
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

				this._displayPager = wrapPager;
				this._updatePagers();

			} else {
				this._options.pager = false;
			}
		},

		_updatePagers: function() {
			if (this._options.pager && this._displayPager) {
				this._displayPager
					.children('.'+ this._options.pagerSelectedClass)
					.removeClass(this._options.pagerSelectedClass);

				this._displayPager
					.children()
					.eq(this._position)
					.addClass(this._options.pagerSelectedClass);
			}
		},

		_destroyPager: function() {
			if (this._options.pager) {
				this._displayPager.find('.'+ this._options.pagerClass).unbind('click.'+ NAMESPACE);
				this._displayPager.remove();

				delete(this._displayPager);
				this._options.pager = false;
			}
		},

		_onClickPager: function(event) {
			event.preventDefault();
			var index = $(event.currentTarget).data('index');
			this.applyPosition(index);
			this.autoplayStop();
		},

		/* Biglink
		/* ------------------------------------------------------------------ */

		_initBiglink: function() {
			if (this._options.biglink && typeof this._options.biglinkClass === 'string') {
				var
					self = this,
					biglinks = this.$el.find('.'+ this._options.biglinkClass),
					biglink
				;

				if (biglinks.length > 0) {
					this._preInitStyles = this._preInitStyles || {};
					this._preInitStyles.biglinks = [];

					biglinks.each(function() {
						biglink = $(this);
						self._preInitStyles.biglinks.push({
							biglink: biglink,
							attrStyle: biglink.attr('style')
						});
					});


					biglinks
						.css('cursor','pointer')
						.bind('click.'+ NAMESPACE, proxy(this._onClickBiglink, this));
				}
			}
		},

		_destroyBiglink: function() {
			if (this._options.biglink && typeof this._options.biglinkClass === 'string') {
				var
					biglinkData,
					index
				;

				for (index = 0; index < this._preInitStyles.biglinks.length; index++) {
					biglinkData = this._preInitStyles.biglinks[index];
					biglinkData.biglink.unbind('click.'+ NAMESPACE);

					if (typeof biglinkData.attrStyle === 'string') {
						biglinkData.biglink.attr('style', biglinkData.attrStyle);
					} else {
						biglinkData.biglink.removeAttr('style');
					}
				}

				delete(this._preInitStyles.biglinks);
			}
		},

		_onClickBiglink: function(event) {
			event.preventDefault();
			event.stopPropagation();

			var link = $(event.currentTarget).find('a').get(0);
			if (link && typeof link.href === 'string') {
				switch (link.target) {
					case '_blank':
						window.open(link.href);
						break;
					case '_parent':
						if (window.parent && window.parent.parent && window.parent.parent.window && window.parent.parent.window.location !== window.location) {
							window.parent.parent.window.location = link.href;
						} else {
							window.location.href = link.href;
						}
						break;
					case '_top':
						if (window.top && window.top.location !== window.location) {
							window.top.location.href = link.href;
						} else {
							window.location.href = link.href;
						}
						break;
					default:
						if (typeof link.target === 'string' && link.target !== '_self') {
							window.open(link.href, link.target);
						} else {
							window.location.href = link.href;
						}
						break;
				}
			}
		},

		/* Siteclasses
		/* ------------------------------------------------------------------ */

		_initSiteClasses: function() {
			if (this._options.siteClasses) {
				this._siteClassesActive = this._options.siteClassesClass + (this._position + 1);
				this.applySiteClasses();
			}
		},

		_destroySiteClasses: function() {
			if (this._options.siteClasses) {
				this._display.parent().removeClass(this._siteClassesActive);
				this._siteClassesActive = undefined;
				delete(this._siteClassesActive);
			}
		},

		/* Autoplay
		/* ------------------------------------------------------------------ */

		_initAutoplay: function(index) {
			/* Autoplay must be active and there mast be at least more than one page to show */
			if (this._options.autoplay && this._numElements - this._options.itemsToDisplay > 0) {
				var
					delay
				;

				index = (this._options.autoplayDelayQueued) ? index : 1;
				index = index ? index : 0;
				delay = index * this._options.autoplayDelay;

				this.autoplayContinue(delay);
			} else {
				this._options.autoplay = false;
			}
		},

		autoplayContinue: function(delay) {
			if (this._options.autoplay) {
				var	duration = this._options.autoplayPause + (delay ? delay : 0);
				window.setTimeout(proxy(this._onTimeoutAutoplay, this), duration);
			}
		},

		autoplayStop: function() {
			this._options.autoplay = false;
		},

		_destroyAutoplay: function() {
			if (this._options.autoplay) {
				this.autoplayStop(this._options);
			}
		},

		_onTimeoutAutoplay: function() {
			if (this._options.autoplay) {
				this.slideTo(this._options.autoplayDirection);
				this.autoplayContinue();
			}
		},

		/* Infinite
		/* ------------------------------------------------------------------ */

		_initInfinite: function() {
			/* Infinite must be active and there mast be at least more than one page to show */
			if (this._options.infinite && this._numElements - this._options.itemsToDisplay > 0) {
				var
					preItem = this._items.eq(0),
					postItem = this._items.eq(this._numElements - 1),
					counter,
					preCloneIndex,
					preClone,
					postCloneIndex,
					postClone,
					cssFloat
				;

				for (counter = 0; counter < this._options.itemsToDisplay; counter++) {
					preCloneIndex = this._numElements - 1 - counter;
					preClone = this._items.eq(preCloneIndex).clone();

					postCloneIndex = counter;
					postClone = this._items.eq(postCloneIndex).clone();

					cssFloat = (this._options.orientation === ORIENTATION_HORIZONTAL) ? 'left' : 'none';
					postClone.css({cssFloat: cssFloat}).addClass('clone post').insertAfter(postItem);
					preClone.css({cssFloat: cssFloat}).addClass('clone pre').insertBefore(preItem);

					preItem = preClone;
					postItem = postClone;

					/* Store all clones */
					if (typeof this._itemsPre === 'undefined') {
						this._itemsPre = preClone;
						this._itemsPost = postClone;
					} else {
						this._itemsPre = this._itemsPre.add(preClone);
						this._itemsPost = this._itemsPost.add(postClone);
					}
				}

				/* Store all new pre and postitems */
				if (typeof this._itemsPre !== 'undefined') {
					this._itemsAll = this._itemsAll
										.add(this._itemsPre)
										.add(this._itemsPost);
				}

			} else {
				this._options.infinite = false;
			}
		},

		_destroyInfinite: function() {
			if (this._options.infinite) {
				this._itemsPre.remove();
				this._itemsPost.remove();

				this._itemsPre = undefined;
				this._itemsPost = undefined;

				delete(this._itemsPre);
				delete(this._itemsPost);

				this._options.infinite = false;
			}
		},

		/* Selected
		/* ------------------------------------------------------------------ */

		_initSelected: function() {
			var selected = this._items.filter('.'+ this._options.selectedClass);
			if (selected.length > 0) {
				this._position = this._items.index(selected.get(0));
			}
		},

		/* Autoresize
		/* ------------------------------------------------------------------ */

		_initAutoresize: function() {
			if (this._options.autoresize) {
				$window.bind('resize.'+ NAMESPACE, proxy(this._onResize, this));
			}
		},

		_destroyAutoresize: function() {
			if (this._options.autoresize) {
				$window.unbind('resize.'+ NAMESPACE);
				this._options.autoresize = false;
			}
		},

		_onResize: function() {
			this.refreshSize();
		},

		/* Touch
		/* ------------------------------------------------------------------ */

		_initTouch: function() {
			if (this._options.touch) {

				//Prevent Image and link dragging:
				this.$el.find('img, a').bind('dragstart.'+ NAMESPACE, function(event) {
					event.preventDefault();
				});

				this._display
					.bind(
						'mousedown.'+ NAMESPACE +' '+
						'touchstart.'+ NAMESPACE,
						proxy(this._onTouchStart, this)
					);
			}
		},

		_destroyTouch: function() {
			if (this._options.touch) {
				this._display
					.unbind('mousedown.'+ NAMESPACE)
					.unbind('mousemove.'+ NAMESPACE)
					.unbind('mouseup.'+ NAMESPACE)
					.unbind('touchstart.'+ NAMESPACE)
					.unbind('touchmove.'+ NAMESPACE)
					.unbind('touchend.'+ NAMESPACE);

				$document
					.unbind('mouseup.'+ NAMESPACE)
					.unbind('touchend.'+ NAMESPACE);

				this.$el.find('img, a')
					.unbind('dragstart.'+ NAMESPACE);

				this._options.touch = false;
			}
		},

		_getTouchBaseEvent: function(event) {
			if (event.originalEvent.touches) {
				return event.originalEvent.touches[0];
			} else {
				return event.originalEvent;
			}
		},

		_onTouchStart: function(event) {
			if ((!this._playing && this._options.infinite) || !this._options.infinite) {

				var
					baseEvent = this._getTouchBaseEvent(event),
					position
				;

				if (this._options.infinite) {
					position = this._getPosition();
				} else {
					position = this._setPositionCancel(); // Cancel old animations, get current position
				}

				// Genrate new touchData object:
				this._touchData = {
					slider: {
						left: position.left,
						top: position.top
					},
					start: {
						left: baseEvent.pageX,
						top: baseEvent.pageY
					},
					difference: {
						left: 0,
						top: 0
					},
					tolerance: this._options.touchDirectionTolerance * (2 - getViewportScale()),
					toleranceReached: false
				};

				// Bind / unbind events:
				$document
						.bind(
							'mouseup.'+ NAMESPACE +' '+
							'touchend.'+ NAMESPACE,
							proxy(this._onTouchEnd, this)
						);

				this._display
					.bind(
						'mousemove.'+ NAMESPACE +' '+
						'touchmove.'+ NAMESPACE,
						proxy(this._onTouchMove, this)
					)
					.unbind(
						'mousedown.'+ NAMESPACE +' '+
						'touchstart.'+ NAMESPACE
					);
			}
		},

		_onTouchMove: function(event) {
			// Chrome on android can have an issue with touchmove. On some
			// devices 'touchcancel' is fired after the first 'touchmove' was
			// triggered. The device/browser asumes that the user tries to
			// scroll the page content and stop further touch events
			// (touchmove, touchend) after canceling
			// touch gestures (touchcancel event is fired)
			// To get around this is using event.preventDefault() in this
			// function, but we only want to stop the default behaviour, when a
			// concrete tolerance value was reached and as a result of the
			// reached tolerance it's clear the user wants to scroll the
			// slideshow and not the page content.
			//
			// This issue isn't fixed for android chrome browsers.
			// See also the bugreport:
			// https://code.google.com/p/android/issues/detail?id=19827
			var
				baseEvent = this._getTouchBaseEvent(event)
			;

			// Stop autoplay feature to prevent switch on move:
			this._options.autoplay = false;

			// Calculate new touchData:
			this._touchData.difference = {
				left: baseEvent.pageX - this._touchData.start.left,
				top: baseEvent.pageY - this._touchData.start.top
			};

			// Check if any tolerance value is reached/exceeded:
			if (!this._touchData.toleranceReached) {
				if (this._options.orientation === ORIENTATION_HORIZONTAL) {
					if (Math.abs(this._touchData.difference.left) < this._touchData.tolerance) {
						// Tolerance never reached and currently also no reached:
						// do not continue...
						return;
					}
				} else {
					if (Math.abs(this._touchData.difference.top) < this._touchData.tolerance) {
						// Tolerance never reached and currently also no reached:
						// do not continue...
						return;
					}
				}
			}

			// When getting to this point, the tolerance is reached, start to animate:
			if (!this._touchData.toleranceReached) {
				this._touchData.toleranceReached = true;
			}

			// Stop default behaviour:
			event.preventDefault();
			event.stopPropagation();

			// Aniamte:
			switch (this._options.orientation) {
				case ORIENTATION_HORIZONTAL:
					this._setPosition(
						{
							left: this._touchData.slider.left + this._touchData.difference.left,
							top: 0
						},
						false
					);
					break;
				case ORIENTATION_VERTICAL:
					this._setPosition(
						{
							left: 0,
							top: this._touchData.slider.top + this._touchData.difference.top
						},
						false
					);
					break;
			}
		},

		_onTouchEnd: function(event) {
			this._playing = false;
			if (this._touchData.toleranceReached) {
				event.preventDefault();

				var
					differenceAbs,
					direction
				;

				// Calculate scroll direction:
				if (this._options.orientation === ORIENTATION_HORIZONTAL) {
					differenceAbs = Math.abs(this._touchData.difference.left);
					direction = this._touchData.difference.left / differenceAbs;
				} else {
					differenceAbs = Math.abs(this._touchData.difference.top);
					direction = this._touchData.difference.top / differenceAbs;
				}

				// Set position:
				if (differenceAbs >= this._options.touchTolerance) {
					this.slideTo(direction * -1);
				} else {
					this.slideTo(0);
				}
			} else {
				this.slideTo(0);
			}

			// Bind / unbind events:
			$document
				.unbind(
					'mouseup.'+ NAMESPACE +' '+
					'touchend.'+ NAMESPACE
				);

			this._display
				.bind(
					'mousedown.'+ NAMESPACE +' '+
					'touchstart.'+ NAMESPACE,
					proxy(this._onTouchStart, this)
				)
				.unbind(
					'mousemove.'+ NAMESPACE +' '+
					'touchmove.'+ NAMESPACE
				);

			// Cleanup touchdata:
			this._touchData = undefined;
			delete(this._touchData);
		},

		/* Controls
		/* ------------------------------------------------------------------ */

		next: function() {
			this.slideTo(1);
		},

		previous: function() {
			this.slideTo(-1);
		},

		slideTo: function(direction) {
			if (this.initialized && !this._playing) {
				direction = direction * this._options.itemsToScroll;
				this._position = this._position + direction;
				this.applyPosition();
			}
		},

		applyPosition: function(position, animated) {
			animated = (typeof animated === 'undefined' || animated);

			var
				newPositionX = 0,
				newPositionY = 0,
				infiniteOffset = 0
			;

			if (typeof position !== 'undefined') {
				this._position = position;
			}

			if (!this._options.infinite) {
				if (this._position < 0) {
					this._position = 0;
				} else if (this._position > this._numElements - this._options.itemsToDisplay) {
					this._position = this._numElements - this._options.itemsToDisplay;
				}
			} else {
				//Detect Offset for infinite loops:
				if (this._options.orientation === ORIENTATION_HORIZONTAL) {
					infiniteOffset = this._itemWidth * this._options.itemsToDisplay * -1;
				} else {
					infiniteOffset = this._itemHeight * this._options.itemsToDisplay * -1;
				}
			}

			//Calculate new Positions:
			if (this._options.orientation === ORIENTATION_HORIZONTAL) {
				newPositionX = (this._position * this._itemWidth * -1) + infiniteOffset;
			} else {
				newPositionY = (this._position * this._itemHeight * -1) + infiniteOffset;
			}

			//Set New Positions:
			this._setPosition({
				left: newPositionX,
				top: newPositionY,
				duration: this._options.duration
			}, animated, proxy(this._applyPositionComplete, this));

			//Update features:
			this._updateButtons();
			this.applySiteClasses();
			this.applyItemClasses();

			if (!animated) {
				this._updatePagers();
			}

			if (typeof this._options.onUpdate === 'function') {
				this._options.onUpdate(this.$el);
			}
		},

		_applyPositionComplete: function() {
			if (this._options.infinite) {
				if (this._position < -(this._options.itemsToDisplay - this._options.itemsToScroll)) {
					this.applyPosition(this._numElements - this._options.itemsToDisplay, false);
				} else if (this._position >= this._numElements) {
					this.applyPosition(0, false);
				}
			}

			this._updatePagers();
		},

		applySiteClasses: function() {
			if (this._options.siteClasses) {
				this._display
					.parent()
					.removeClass(this._siteClassesActive);

				this._siteClassesActive = this._options.siteClassesClass + (this._position + 1);

				this._display
					.parent()
					.addClass(this._siteClassesActive);
			}
		},

		applyItemClasses: function() {
			if (this._options.itemsClasses) {
				var
					self = this,
					item,
					from,
					to
				;

				//General items:
				this._items.each(function(index) {
					item = $(this);
					if (index < self._position && !item.hasClass(self._options.itemsPrevClass)) {
						item.removeClass(self._options.itemsCurrentClass)
							.removeClass(self._options.itemsNextClass)
							.addClass(self._options.itemsPrevClass);
					} else if (index === self._position && !item.hasClass(self._options.itemsCurrentClass)) {
						item.removeClass(self._options.itemsPrevClass)
							.removeClass(self._options.itemsNextClass)
							.addClass(self._options.itemsCurrentClass);
					} else if (index > self._position && !item.hasClass(self._options.itemsNextClass)) {
						item.removeClass(self._options.itemsCurrentClass)
							.removeClass(self._options.itemsPrevClass)
							.addClass(self._options.itemsNextClass);
					}
				});


				//Pre and Post items:
				if (this._options.infinite) {
					//Preitems:
					if (this._position < -(this._options.itemsToDisplay - this._options.itemsToScroll)) {
						from = this._numElements - this._options.itemsToDisplay;
						to = this._numElements;
						if (from >= 0 && from < this._numElements) {
							this._items.slice(from, to)
								.removeClass(this._options.itemsPrevClass)
								.removeClass(this._options.itemsNextClass)
								.addClass(this._options.itemsCurrentClass);
						}

						this._itemsPre
							.removeClass(this._options.itemsPrevClass)
							.addClass(this._options.itemsCurrentClass);
					} else {
						this._itemsPre
						.removeClass(this._options.itemsCurrentClass)
						.addClass(this._options.itemsPrevClass);
					}

					//Postitems:
					if (this._position >= this._numElements) {
						from = 0;
						to = this._options.itemsToDisplay;
						if (to < this._numElements) {
							this._items.slice(from, to)
								.removeClass(this._options.itemsPrevClass)
								.removeClass(this._options.itemsNextClass)
								.addClass(this._options.itemsCurrentClass);
						}
						this._itemsPost
							.removeClass(this._options.itemsNextClass)
							.addClass(this._options.itemsCurrentClass);
					} else {
						this._itemsPost
							.removeClass(this._options.itemsCurrentClass)
							.addClass(this._options.itemsNextClass);
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
			width = this._display.parent().width();

			if (this._options.orientation === ORIENTATION_HORIZONTAL) {
				this._itemsAll.width((this._options.width || width) / this._options.itemsToDisplay);
				this.$el.width(this._itemsAll.length * ((this._options.width || width) / this._options.itemsToDisplay));
			} else {
				this._itemsAll.width(this._options.width || width);
				this.$el.width(this._itemsAll.length * (this._options.width || width));
			}

			//Reset height forvertical elements:
			this._itemsAll.height('');

			//Calculate height:
			this._itemsAll.each(function() {
				height = Math.max($(this).outerHeight(true), height);
			});

			//Store and apply values:
			if (this._options.orientation === ORIENTATION_HORIZONTAL) {
				this._itemWidth = (this._options.width || width) / this._options.itemsToDisplay;
				this._display
					.width(this._options.width || width)
					.height(this._options.height || height);
			} else {
				this._itemWidth = this._options.width || width;
				this._display
					.width(this._options.width || width)
					.height((this._options.height || height * this._options.itemsToDisplay));
			}
			this._itemHeight = this._options.height || height;
			this._itemsAll.height(this._itemHeight);

			this.applyPosition(undefined, false);
		},

		getId: function() {
			return this._id;
		},

		getOptions: function() {
			return this._options;
		},

		setItemsToDisplay: function(value) {
			if (typeof value === 'number' &&
				value !== this._options.itemsToDisplay &&
				value > 0 &&
				value <= this._numElements) {

				if (this._options.infinite) {
					//TODO: add possebility to change value for infinite mode:
					throw new Error('You can only set "itemsToDisplay" when the option "infinite" is disabled.');
				}

				// Set value and update slider:
				this._options.itemsToDisplay = value;
				this.refreshSize();

				// Update pager:
				if (this._options.pager) {
					this._destroyPager();
					this._options.pager = true; // _destroyPager() resets pageroption...
					this._initPager();
				}
			}
		},

		getItemsToDisplay: function() {
			return this._options.itemsToDisplay;
		},

		setItemsToScroll: function(value) {
			if (typeof value === 'number' &&
				value !== this._options.itemsToScroll &&
				value > 0) {

				// Set value and update slider:
				this._options.itemsToScroll = value;
				this.refreshSize();

				// Update pager:
				if (this._options.pager) {
					this._destroyPager();
					this._options.pager = true; // _destroyPager() resets pageroption...
					this._initPager();
				}
			}
		},

		getItemsToScroll: function() {
			return this._options.itemsToScroll;
		},

		hasHardware: function() {
			return this._hasHardware;
		},

		_getPosition: function() {
			if (this._hasHardware) {
				var
					matrix = this.$el.css(this._cssTransformKey),
					isMatrix3d = matrix.indexOf('matrix3d') > -1,
					left,
					top
				;

				matrix = matrix
					.replace(/matrix3d/,'matrix')
					.match(/(?:[-\d(\.(\d)*)?]+[\s,]*)+/)[0]
					.split(',');

				if (isMatrix3d) {
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
					self._playing = false;
					if (typeof callback === 'function') {
						callback();
					}
				}
			;

			// Check if there is nothing to change:
			if (Math.floor(currentPosition.left) === Math.floor(properties.left) &&
				Math.floor(currentPosition.top) === Math.floor(properties.top)) {
				return;
			}

			if (properties.duration === undefined) {
				properties.duration = this._options.duration;
			}

			if (this._hasHardware) {
				// Animate:
				if (animated) {
					this._playing = true;
					this.$el.css(this._cssTransitionKey, this._cssTransformKey +' '+ (properties.duration / 1000) +'s ease 0s');

						// Using a css transitionend event ends in some missing
						// callbacks when the website content is scrolled on a
						// touch device and the slideshow is also scrolled using
						// the touch feature.
						// For this circumstances we use the timeout function...
						if (this._animationTimeout) {
							window.clearTimeout(this._animationTimeout);
						}

						this._animationTimeout = window.setTimeout(function() {
							self._animationTimeout = undefined;
							delete(self._animationTimeout);

							// Call callback:
							if (typeof onCallback === 'function') {
								onCallback();
							}
						}, properties.duration);
				} else {
					this.$el.css(this._cssTransitionKey, this._cssTransformKey +' 0s ease 0s');

					// Call callback:
					if (typeof onCallback === 'function') {
						onCallback();
					}
				}

				this.$el
					.css(this._cssTransformKey, 'translate3d('+ (properties.left || 0) +'px,'+ (properties.top || 0) +'px,0)');
			} else {
				cssProperties.marginLeft = properties.left || 0;
				cssProperties.marginTop = properties.top || 0;

				// Animate:
				if (animated) {
					this._playing = true;
					this.$el.stop().animate(cssProperties, properties.duration, function() {
						// Call callback:
						if (typeof onCallback === 'function') {
							onCallback();
						}
					});
				} else {
					this.$el.stop().css(cssProperties);

					// Call callback:
					if (typeof onCallback === 'function') {
						onCallback();
					}
				}
			}
		},

		_setPositionCancel: function() {
			var position = this._getPosition();

			if (this._playing) {
				this._playing = false;

				if (this._hasHardware) {
					this.$el
						.css(this._cssTransitionKey, '')
						.css(this._cssTransformKey, 'translate3d('+ (position.left || 0) +'px,'+ (position.top || 0) +'px,0)');
				} else {
					this.$el.stop();
				}
			}

			return position;
		}

	});


	/* jQuery Plugin API
	/* ---------------------------------------------------------------------- */

	jQueryApi = {
		init: function(options) {
			return $(this).each(function() {
				new HipsterSlider(
					$(this),
					$.extend({}, DEFAULTS, options)
				);
			});
		},

		instance: function() {
			var result = null;
			$(this).each(function() {
				result = getInstance($(this));
				if (result) {
					return false; // stop loop when first instance found
				}
			});

			return result;
		},

		next: function() {
			return $(this).each(function() {
				var instance = getInstance($(this));
				if (typeof instance === 'object') {
					instance.next();
				}
			});
		},

		/* DEPRECATED:
		/* jquery hipsterSlider method 'prev' is deprecated, please
		/* use 'previous' $('ul').hipsterSlider('previous'); */
		prev: function() {
			if (typeof window.console === 'object' && typeof window.console.warn === 'function') {
				window.console.warn('jquery hipsterSlider method "prev" is deprecated, please us "previous"');
			}

			return $(this).each(function() {
				var instance = getInstance($(this));
				if (typeof instance === 'object') {
					instance.previous();
				}
			});
		},

		previous: function() {
			return $(this).each(function() {
				var instance = getInstance($(this));
				if (typeof instance === 'object') {
					instance.previous();
				}
			});
		},

		page: function(index) {
			var instance;
			if (typeof index === 'number') {
				return $(this).each(function() {
					instance = getInstance($(this));
					if (typeof instance === 'object') {
						instance.applyPosition(index);
					}
				});
			} else {
				instance = getInstance($(this));
				if (typeof instance === 'object') {
					return instance._position;
				} else {
					return -1;
				}
			}
		},

		stop: function() {
			return $(this).each(function() {
				var instance = getInstance($(this));
				if (typeof instance === 'object') {
					instance.autoplayStop();
				}
			});
		},

		getPosition: function() {
			var instance = getInstance($(this));
			if (typeof instance === 'object') {
				return instance._position;
			} else {
				return -1;
			}
		},

		options: function() {
			var instance = getInstance($(this));
			if (typeof instance === 'object') {
				return instance.getOptions();
			} else {
				return null;
			}
		},

		itemsToDisplay: function(value) {
			var
				elements = $(this),
				result = -1
			;

			if (typeof value === 'number') {
				// set value for each element:
				return elements.each(function() {
					var instance = getInstance($(this));
					if (typeof instance === 'object') {
						instance.setItemsToDisplay(value);
					}
				});
			} else {
				// get value from first element:
				elements.each(function() {
					var instance = getInstance($(this));
					if (typeof instance === 'object') {
						result = instance.getItemsToDisplay();
						return false; // stop loop when first instance found
					}
				});

				return result;
			}
		},

		destroy: function() {
			return $(this).each(function() {
				var instance = getInstance($(this));
				if (typeof instance === 'object') {
					instance.destroy();
				}
			});
		},

		refreshSize: function() {
			var instance = getInstance($(this));
			if (typeof instance === 'object') {
				instance.refreshSize();
			}
		}
	};


	/* Directing calls into jQuery Plugin API
	/-------------------------------------------------------------------------*/
	$.fn.hipsterSlider = function(method) {
		if (jQueryApi[method]) {
			return jQueryApi[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || method === undefined) {
			return jQueryApi.init.apply(this, arguments);
		} else {
			$.error('Method '+  method +' does not exist on jQuery.'+ NAMESPACE);
		}
	};


	/* Public Constants & Values
	/-------------------------------------------------------------------------*/
	$.hipsterSlider = $.hipsterSlider || {};

	$.hipsterSlider.Class = HipsterSlider;
	$.hipsterSlider.Registry = HipsterSliderRegistry;

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

}));
