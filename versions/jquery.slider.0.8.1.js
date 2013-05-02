/**
 *  jquery.slider.js
 *
 *  @author Norman Rusch (schorfES)
 *  @repository GitHub | https://github.com/schorfES/jquery.slider
 */

;(function( $ ){

	var ORIENTATION_HORIZONTAL = 'horizontal';
	var ORIENTATION_VERTICAL = 'vertical';

	var DIRECTION_FORWARD = 1;
	var DIRECTION_BACKWARD = -1;

	var defaults = {
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

		pager: false,								/* activates paging buttons */
		pagerWrapClass: 'pager-buttons',			/* classname for the ul list of the pagers */
		pagerClass: 'pager-button',					/* classname for the li pager entry */
		pagerSelectedClass: 'selected',				/* classname for the selected/active page */

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
		autoresizeKeepRatio: false,					/* forces the slider to keep the start aspectratio when the slidshow resizes (note: this only works for horizontal scroling, in vertical orientation the aspectration is always the same)*/

		touch: false,								/* enables / disables touchfeature for mobile devices */
		touchTolerance: 20,							/* defines the tolerance in pixels to move before slide to a next position */
		touchDirectionTolerance: 75,				/* defines the tolerance in pixels until the regular touchsliding terminates when the other axis is used */

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

			playing: set to true if animation is active

			siteClassesActive: name of the active siteClasses class

			hasHardware: indicator if css3-hardware-acceleration-features are available
			cssTransformKey: css property including renderprefix for css3 transforms
			cssTransitionKey: css property including renderprefix for css3 transitions
			cssAnimationTimeout: is the timeout-instance for css3 animations

			preInitStyles: object that stores all styles of modified DOM elements
		*/
	};


	/* Public Functions:
	/-------------------------------------------------------------------------*/
	var methods = {
		init : function( options ) {
			var
				target = $(this),
				index = 0,
				element, localOptions
			;

			return target.each( function() {
				element = $(this);
				localOptions = $.extend({}, defaults, options);

				initElement(element, localOptions);
				if( localOptions.initialized === true ) {
					initHardware(element, localOptions);
					initButtons(element, localOptions);
					initPager(element, localOptions);
					initBiglink(element, localOptions);
					initSiteClasses(element, localOptions);
					initAutoplay(element, localOptions, index);
					initInfinite(element, localOptions);
					initSelected(element, localOptions);
					initAutoresize(element, localOptions);
					initTouch(element, localOptions);

					applyPosition(element, localOptions.position, false);
					index++;
				}
			});
		},

		next : function() {
			var target = $(this);
			slideTo(target, +1);
			return target;
		},

		prev : function() {
			var target = $(this);
			slideTo(target, -1);
			return target;
		},

		page: function(index) {
			var
				target = $(this),
				options = target.data('sliderOptions')
			;

			if( typeof index === 'number' ) {
				if( typeof options === 'object' ) {
					applyPosition(target, index);
				}
				return target;
			} else {
				return options.position;
			}
		},

		stop : function() {
			var target = $(this);
			var options = target.data('sliderOptions');
			if( typeof options === 'object' ) {
				stopAutoplay(options);
			}
			return target;
		},

		getPosition : function() {
			var result = -1;
			var target = $(this);
			var options = target.data('sliderOptions');
			if( typeof options === 'object' ) {
				result = options.position;
			}
			return result;
		},

		options : function() {
			return $(this).data('sliderOptions');
		},

		destroy : function() {
			var options = $(this).data('sliderOptions');
			if( typeof options === 'object' ) {
				/* destruction function should be called reversed to init functions */
				destroyTouch(options);
				destroyAutoresize(options);
				destroyInfinite(options);
				destroyAutoplay(options);
				destroySiteClasses(options);
				destroyBiglink(options);
				destroyPager(options);
				destroyButtons(options);
				destroyHardware(options);
				destroyElement(options);
			}
		}
	};


	/* Private Functions: Initialization
	/-------------------------------------------------------------------------*/

	var initElement = function(element, options) {
		var elementTagname = element.get(0).tagName.toLowerCase();
		if( elementTagname === options.tagName ) {

			options.preInitStyles = options.preInitStyles || {};
			options.preInitStyles.element = { attrStyle: element.attr('style') };

			var display = $('<div />').addClass( options.displayClass );
			var items = element.children();

			if( options.initializeMinItems === false && items.length <= options.itemsToDisplay ) {
				return false;
			}

			element.css({cssFloat: 'left'});

			options.position = (typeof options.position === 'number' && options.position > -1) ? options.position : 0;
			options.numElements = items.length;
			options.widthItem = items.outerWidth(true);
			options.heightItem = items.outerHeight(true);

			var item;
			options.preInitStyles.items = [];
			items.each( function() {
				item = $(this);
				options.preInitStyles.items.push({
					item: item,
					attrStyle: item.attr('style')
				});
				options.widthItem = Math.max(item.outerWidth(true), options.widthItem);
				options.heightItem = Math.max(item.outerHeight(true), options.heightItem);
			});

			options.items = items;
			options.itemsAll = items;

			switch( options.orientation ) {
				case ORIENTATION_HORIZONTAL:

					options.width = options.width || (options.widthItem * options.itemsToDisplay);
					options.height = options.height || options.heightItem;
					display.width( options.width ).height( options.height );
					items.css('float','left');

					element
						.width( items.outerWidth() * items.length )
						.height( options.height );


					break;
				case ORIENTATION_VERTICAL:

					options.width = options.width || options.widthItem;
					options.height = options.height || (options.heightItem * options.itemsToDisplay);
					display.width( options.width ).height( options.height );
					items.css('float','none');

					break;
			}

			display
				.css('overflow', 'hidden')
				.css('position', 'relative');

			element
				.wrap(display)
				.data('sliderOptions', options)
				.css('overflow','visible');

			options.display = element.parent();
			options.element = element;
			options.playing = false;
			options.initialized = true;

			return true;
		}
		return false;
	};

	var initHardware = function(element, options) {
		if( options.useHardware === true ) {
			var css = {}, key,
				prefixes = ['-webkit-','-moz-','-o-','-ms-','-khtml-',''];

			/* Build properties with prefixes and add value to test */
			for(key in prefixes) { css[prefixes[key]+'transform'] = 'translate3d(0,0,0)'; }
			element.css(css);

			if( hasCssProperty('transition') && hasCssProperty('transform') && (/translate3d/).test(getCssProperty(element, 'transform')) ) {
				options.hasHardware = true;

				/* Prefixes: 'Moz', 'Webkit', 'Khtml', 'O', 'ms', 'Icab' */
				options.cssTransformKey = hasCssProperty('transform',true)
											.replace(/MozT/,'-moz-t')
											.replace(/WebkitT/,'-webkit-t')
											.replace(/OT/,'-o-t')
											.replace(/msT/,'-ms-t')
											.replace('KhtmlT','-khtml-t');

				options.cssTransitionKey = hasCssProperty('transition',true)
											.replace(/MozT/,'-moz-t')
											.replace(/WebkitT/,'-webkit-t')
											.replace(/OT/,'-o-t')
											.replace(/msT/,'-ms-t')
											.replace('KhtmlT','-khtml-t');
			} else {
				/* Build properties with prefixes and add empty values to remove test values. */
				for(key in prefixes) { css[prefixes[key]+'transform'] = ''; }
				element.css(css);
			}
		}
	};

	var initButtons = function(element, options) {
		/* Buttons must be active and there mast be at least more than one page to show */
		if( (options.buttons === true && options.numElements - options.itemsToDisplay > 0 ) ) {

			var prevButton = $('<a href="#" class="'+ options.buttonsClass +' '+ options.buttonPrevClass +'">'+ options.buttonPrevLabel +'</a>');
			var nextButton = $('<a href="#" class="'+ options.buttonsClass +' '+ options.buttonNextClass +'">'+ options.buttonNextLabel +'</a>');
			var wrapButtons;
			if( options.buttonsWrap ) {
				wrapButtons = $('<div class="'+ options.buttonsWrapClass +'" />');
				wrapButtons.insertAfter( options.display );
			} else {
				wrapButtons = options.display.parent();
			}

			prevButton
				.appendTo( wrapButtons )
				.bind('click.slider', function(event) {
					event.preventDefault();
					slideTo(element, -1);
					stopAutoplay(options);
				} );


			nextButton
				.appendTo( wrapButtons )
				.bind('click.slider', function(event) {
					event.preventDefault();
					slideTo(element, +1);
					stopAutoplay(options);
				} );


			options.buttonPrev = prevButton;
			options.buttonNext = nextButton;
			options.displayButtons = wrapButtons;

			applyButtons(element, options);
		} else {
			options.buttons = false;
		}
	};

	var initPager = function(element, options) {
		/* Pagers must be active and there mast be at least more than one page to show */
		if( options.pager === true && options.numElements - options.itemsToDisplay > 0 ) {

			var wrapPager = $('<ol class="'+ options.pagerWrapClass +'" />');
			var clickHandler = function(event) {
				event.preventDefault();
				var index = $(event.currentTarget).data('index');
				applyPosition(element, index);
				stopAutoplay(options);
			};

			for( var count = 1; count <= options.numElements; count++ ) {
				var page = $('<li class="'+ options.pagerClass +'"><a href="#">'+ count +'</a></li>')
								.data('index', count - 1)
								.appendTo( wrapPager )
								.bind('click.slider', clickHandler);
			}

			wrapPager.insertAfter( options.display );
			options.displayPager = wrapPager;
			applyPaging(element, options);

		} else {
			options.pager = false;
		}
	};

	var initBiglink = function(element, options) {
		if( options.biglink === true && typeof options.biglinkClass === 'string' ) {
			var
				biglinks = element.find( '.'+ options.biglinkClass ),
				biglink
			;

			if( biglinks.length > 0 ) {
				options.preInitStyles = options.preInitStyles || {};
				options.preInitStyles.biglinks = [];

				biglinks.each(function() {
					biglink = $(this);
					options.preInitStyles.biglinks.push({
						biglink: biglink,
						attrStyle: biglink.attr('style')
					});
				});


				biglinks.css('cursor','pointer')
					.bind('click.slider', function(event) {
						event.preventDefault();
						event.stopPropagation();

						var link = $(event.currentTarget).find('a').eq(0);
						if( link.length > 0 ) {
							document.location.href = link.attr('href');
						}
					} );
			}
		}
	};

	var initSiteClasses = function(element, options) {
		options.siteClassesActive = options.siteClassesClass + (options.position + 1);
		applySiteClasses(element, options);
	};

	var initAutoplay = function(element, options, index) {
		/* Autoplay must be active and there mast be at least more than one page to show */
		if( options.autoplay === true && options.numElements - options.itemsToDisplay > 0 ) {
			index = (options.autoplayDelayQueued) ? index : 1;
			setTimeout( function() {
				autoplay(element, options);
			}, options.autoplayPause + (index * options.autoplayDelay) );
		} else {
			options.autoplay = false;
		}
	};

	var initInfinite = function(element, options) {
		/* Infinite must be active and there mast be at least more than one page to show */
		if( options.infinite === true && options.numElements - options.itemsToDisplay > 0 ) {

			var preItem = options.items.eq(0);
			var postItem = options.items.eq(options.numElements - 1);

			for(var counter = 0; counter < options.itemsToDisplay; counter++) {
				var preCloneIndex = options.numElements - 1 - counter;
				var preClone = options.items.eq(preCloneIndex).clone();

				var postCloneIndex = counter;
				var postClone = options.items.eq(postCloneIndex).clone();

				var cssFloat = ( options.orientation == ORIENTATION_HORIZONTAL ) ? 'left' : 'none';
				postClone.css({cssFloat: cssFloat}).addClass('clone post').insertAfter(postItem);
				preClone.css({cssFloat: cssFloat}).addClass('clone pre').insertBefore(preItem);

				preItem = preClone;
				postItem = postClone;

				/* Store all clones */
				if( typeof options.itemsPre === 'undefined' ) {
					options.itemsPre = preClone;
					options.itemsPost = postClone;
				} else {
					options.itemsPre = options.itemsPre.add(preClone);
					options.itemsPost = options.itemsPost.add(postClone);
				}
			}

			/* Store all new pre and postitems */
			if( typeof options.itemsPre !== 'undefined' ) {
				options.itemsAll = options.itemsAll.add(options.itemsPre).add(options.itemsPost);
			}

			if( options.orientation == ORIENTATION_HORIZONTAL ) {
				element.width( element.width() + options.widthItem * options.itemsToDisplay * 2 );
			}
		} else {
			options.infinite = false;
		}
	};

	var initSelected = function(element, options) {
		var selected = options.items.filter('.'+ options.selectedClass);
		if( selected.length > 0 ) {
			options.position = options.items.index( selected.get(0) );
		}
	};

	var initAutoresize = function(element, options) {
		if( options.autoresize === true ) {
			$(window).bind('resize.slider', function() { refreshSize(options); } );
			refreshSize(options);
		}
	};

	var initTouch = function(element, options) {
		if( options.touch === true ) {
			var
				startX, startY,
				pos, posX, posY,
				diffX, diffY, diffAbs,
				direction, baseEvent, target
			;

			//Prevent Imagedragging:
			element.find('img').on('dragstart', function(event) {
				event.preventDefault();
			});

			var onMouseDown = function(event) {
				if( !options.playing ) {
					baseEvent = (event.originalEvent.touches) ? event.originalEvent.touches[0] : event.originalEvent;
					target = $(event.currentTarget);

					pos = getPosition(element, options);
					posX = pos.left;
					posY = pos.top;
					startX = baseEvent.pageX;
					startY = baseEvent.pageY;
					diffX = 0;
					diffY = 0;

					target
						.bind('mousemove.slider', onMouseMove )
						.bind('touchmove.slider', onMouseMove );

					$(document)
						.bind('mouseup.slider', onMouseLeave )
						.bind('touchend.slider', onMouseLeave );

					options.itemsAll
						.unbind('mousedown.slider', onMouseDown )
						.unbind('touchstart.slider', onMouseDown );
				}
			};

			var onMouseMove = function(event) {
				options.autoplay = false;
				baseEvent = (event.originalEvent.touches) ? event.originalEvent.touches[0] : event.originalEvent;

				diffX = baseEvent.pageX - startX;
				diffY = baseEvent.pageY - startY;

				if( (options.orientation === ORIENTATION_HORIZONTAL && Math.abs(diffX) > options.touchDirectionTolerance) ||
					(options.orientation === ORIENTATION_VERTICAL   && Math.abs(diffY) > options.touchDirectionTolerance) ) {
					event.preventDefault();
				}

				if( options.orientation == ORIENTATION_HORIZONTAL ) {
					setPosition(element, options, {left: posX + diffX, duration: 0.25}, false);
				} else {
					setPosition(element, options, {top: posY + diffY, duration: 0.25}, false);
				}
			};

			var onMouseLeave = function(event) {
				diffAbs = Math.abs( ( options.orientation === ORIENTATION_HORIZONTAL ) ? diffX : diffY );
				direction = ( options.orientation === ORIENTATION_HORIZONTAL ) ? -diffX / diffAbs : -diffY / diffAbs;

				if( diffAbs > options.touchTolerance ) {
					options.playing = false;
					slideTo(element, direction);
				} else {
					options.playing = false;
					slideTo(element, 0);
				}

				target
					.unbind('mousemove.slider', onMouseMove )
					.unbind('touchmove.slider', onMouseMove );

				$(document)
					.unbind('mouseup.slider', onMouseLeave )
					.unbind('touchend.slider', onMouseLeave );

				options.itemsAll
					.bind('mousedown.slider', onMouseDown )
					.bind('touchstart.slider', onMouseDown );

				target = $();
			};


			options.itemsAll
				.bind('mousedown.slider', onMouseDown )
				.bind('touchstart.slider', onMouseDown );
		}
	};


	/* Private Functions: Destruction
	/-------------------------------------------------------------------------*/

	var destroyElement = function(options) {
		if( typeof options.preInitStyles.element.attrStyle === 'string' ) {
			options.element.attr('style', options.preInitStyles.element.attrStyle);
		} else {
			options.element.removeAttr('style');
		}
		options.element.insertAfter(options.display);
		options.display.remove();


		if( options.itemsClasses === true ) {
			options.items
				.removeClass(options.itemsPrevClass)
				.removeClass(options.itemsCurrentClass)
				.removeClass(options.itemsNextClass);
			options.itemsClasses = false;
		}

		if( options.preInitStyles.items.length > 0 ) {
			var itemData;
			for(var i = 0; i < options.preInitStyles.items.length; i++) {
				itemData = options.preInitStyles.items[i];
				if( typeof itemData.attrStyle === 'string' ) {
					itemData.item.attr('style', itemData.attrStyle);
				} else {
					itemData.item.removeAttr('style');
				}
			}
		}

		options.element.removeData('sliderOptions');
		delete(options.element);
		delete(options.items);
		delete(options.itemsAll);
		delete(options.widthItem);
		delete(options.heightItem);
		delete(options.position);
		delete(options.numElements);
		delete(options.display);
		delete(options.playing)
		delete(options.preInitStyles);
		delete(options.initialized);
		delete(options);
	};

	var destroyHardware = function(options) {
		if( options.useHardware === true ) {
			if( options.hasHardware === true ) {
				delete(options.hasHardware);
				delete(options.cssTransformKey);
				delete(options.cssTransitionKey);
			}
		}
	};

	var destroyButtons = function(options) {
		if( (options.buttons === true ) ) {
			options.buttonPrev.unbind('click.slider').remove();
			options.buttonNext.unbind('click.slider').remove();

			if( options.buttonsWrap === true ) {
				options.displayButtons.remove();
			}

			delete(options.buttonPrev);
			delete(options.buttonNext);
			delete(options.displayButtons);
			options.buttons = false;

		} else {
			options.buttons = false;
		}
	};

	var destroyPager = function(options) {
		if( options.pager === true ) {
			options.displayPager.find('.'+ options.pagerClass).unbind('click.slider');
			options.displayPager.remove();

			delete(options.displayPager);
			options.pager = false;
		}
	};

	var destroyBiglink = function(options) {
		if( options.biglink === true && typeof options.biglinkClass === 'string' ) {
			var biglinkData;
			for(var i = 0; i < options.preInitStyles.biglinks.length; i++) {
				biglinkData = options.preInitStyles.biglinks[i];
				biglinkData.biglink.unbind('click.slider');

				if( typeof biglinkData.attrStyle === 'string' ) {
					biglinkData.biglink.attr('style', biglinkData.attrStyle);
				} else {
					biglinkData.biglink.removeAttr('style');
				}
			}

			delete(options.preInitStyles.biglinks);
		}
	};

	var destroySiteClasses = function(options) {
		if( options.siteClasses === true ) {
			options.display.parent().removeClass( options.siteClassesActive );
			options.siteClassesActive = undefined;
			delete(options.siteClassesActive);
		}
	};

	var destroyAutoplay = function(options) {
		if( options.autoplay === true ) {
			stopAutoplay(options);
		}
	};

	var destroyInfinite = function(options) {
		if( options.infinite === true ) {
			options.itemsPre.remove();
			options.itemsPost.remove();

			options.itemsPre = undefined;
			options.itemsPost = undefined;

			delete(options.itemsPre);
			delete(options.itemsPost);

			options.infinite = false;
		}
	};

	var destroyAutoresize = function(options) {
		if( options.autoresize === true ) {
			$(window).unbind('resize.slider');
			options.autoresize = false;
		}
	};

	var destroyTouch = function(options) {
		if( options.touch === true ) {
			options.itemsAll
				.unbind('mousedown.slider')
				.unbind('mousemove.slider')
				.unbind('mouseup.slider')
				.unbind('touchstart.slider')
				.unbind('touchmove.slider')
				.unbind('touchend.slider');

			$(document)
				.unbind('mouseup.slider')
				.unbind('touchend.slider');

			options.touch = false;
		}
	};


	/* Private Functions: Controls
	/-------------------------------------------------------------------------*/

	var getPosition = function(element, options) {
		if( options.hasHardware === true ) {
			var position = element
							.css(options.cssTransformKey)
							.match(/(?:[-\d]+[\s,]*)+/)[0].split(',');
			return {
				left: parseInt(position[4], 10),
				top: parseInt(position[5], 10)
			};
		} else {
			return {
				left: parseInt(element.css('margin-left').replace(/px/, ''), 10),
				top: parseInt(element.css('margin-top').replace(/px/, ''), 10)
			};
		}
	};

	var setPosition = function(element, options, properties, animated, callback) {
		var cssProperties = {};
		var onCallback = function() {
			options.playing = false;
			if( typeof callback === 'function' ) {
				callback();
			}
		};

		if( properties.duration === undefined ) {
			properties.duration = options.duration;
		}

		if( options.hasHardware === true ) {
			//Animate:
			if( animated === true ) {
				options.playing = true;
				element.css(options.cssTransitionKey, options.cssTransformKey +' '+ (properties.duration / 1000) +'s ease 0s');

				/* Use events when transition is competed for webkit and
				 * mozilla firefox, fallback to timeout for other browsers
				 *
				 * @TODO: Check for other browser support */
				if( $.browser.webkit === true ) {
					options.element.one('webkitTransitionEnd', onCallback);
				} else if ( $.browser.mozilla === true ) {
					options.element.one('transitionend', onCallback);
				} else {
					window.clearTimeout( options.cssAnimationTimeout );
					options.cssAnimationTimeout = window.setTimeout(onCallback, properties.duration);
				}
			} else {
				element.css(options.cssTransitionKey, options.cssTransformKey +' 0s ease 0s');
				onCallback();
			}

			element.css(options.cssTransformKey, 'translate3d('+ (properties.left || 0) +'px,'+ (properties.top || 0) +'px,0)');
		} else {
			cssProperties.marginLeft = properties.left || 0;
			cssProperties.marginTop = properties.top || 0;

			//Animate:
			if( animated === true ) {
				options.playing = true;
				element.stop().animate(cssProperties, properties.duration, onCallback);
			} else {
				element.stop().css(cssProperties);
				onCallback();
			}
		}
	};


	var slideTo = function(element, direction) {
		var options = element.data('sliderOptions');
		if( options.initialized === true && options && !options.playing ) {
			direction = direction * options.itemsToScroll;
			options.position = options.position + direction;
			applyPosition(element);
		}
	};

	var applyPosition = function(element, position, animated) {
		animated = (typeof animated === 'undefined' || animated);
		force = (typeof force !== 'undefined' && force);

		var
			newPositionX = 0,
			newPositionY = 0,
			infiniteOffset = 0,
			options = element.data('sliderOptions')
		;

		if( typeof options === 'object' ) {

			if( typeof position !== 'undefined' ) {
				options.position = position;
			}

			if( options.infinite === false ) {
				if( options.position < 0 ) { options.position = 0; }
				if( options.position > options.numElements - options.itemsToDisplay ) { options.position = options.numElements - options.itemsToDisplay; }
			} else {
				//Detect Offset for infinite loops:
				infiniteOffset = (( options.orientation === ORIENTATION_HORIZONTAL) ? options.widthItem : options.heightItem) * options.itemsToDisplay * -1;
			}

			//Calculate new Positions:
			if( options.orientation === ORIENTATION_HORIZONTAL ) {
				newPositionX = (options.position * options.widthItem * -1) + infiniteOffset;
			} else {
				newPositionY = (options.position * options.heightItem * -1) + infiniteOffset;
			}

			//Set New Positions:
			setPosition(element, options, {
					left: newPositionX,
					top: newPositionY,
					duration: options.duration
				}, animated, function() {
					applyPositionComplete(element, options);
				}
			);

			//Update features:
			applyButtons(element, options);
			applySiteClasses(element, options);
			applyItemClasses(element, options);
			if( !animated ) { applyPaging(element, options); }

			if( typeof options.onUpdate === 'function' ) {
				options.onUpdate(element);
			}

		}
	};

	var applyPositionComplete = function(element, options) {
		if( options.infinite === true ) {

			if( options.position < -(options.itemsToDisplay - options.itemsToScroll) ) {
				applyPosition(element, options.numElements - options.itemsToDisplay, false);
			}
			if( options.position >= options.numElements ) {
				applyPosition(element, 0, false);
			}

		}
		applyPaging(element, options);
	};

	var applyButtons = function(element, options) {
		if( options.buttons === true ) {
			if( typeof options.buttonPrev !== 'undefined' ) {
				options.buttonPrev.removeClass( options.buttonDisabledClass );
				if( options.position <= 0 && options.infinite === false ) { options.buttonPrev.addClass( options.buttonDisabledClass ); }
			}

			if( typeof options.buttonNext !== 'undefined' ) {
				options.buttonNext.removeClass( options.buttonDisabledClass );
				if( options.position >= options.numElements - options.itemsToDisplay && options.infinite === false ) { options.buttonNext.addClass( options.buttonDisabledClass ); }
			}
		}
	};

	var applyPaging = function(element, options) {
		if( options.pager === true && options.displayPager ) {
			options.displayPager.children('.'+ options.pagerSelectedClass ).removeClass( options.pagerSelectedClass );
			options.displayPager.children().eq(options.position).addClass( options.pagerSelectedClass );
		}
	};

	var applySiteClasses = function(element, options) {
		if( options.siteClasses === true ) {
			options.display.parent().removeClass( options.siteClassesActive );
			options.siteClassesActive = options.siteClassesClass + (options.position + 1);
			options.display.parent().addClass( options.siteClassesActive );
		}
	};

	var applyItemClasses = function(element, options) {
		if( options.itemsClasses === true ) {
			var item;

			//General items:
			options.items.each( function(index) {
				item = $(this);
				if( index < options.position && !item.hasClass( options.itemsPrevClass ) ) {
					item.removeClass( options.itemsCurrentClass )
						.removeClass( options.itemsNextClass )
						.addClass( options.itemsPrevClass );
				} else if( index == options.position && !item.hasClass( options.itemsCurrentClass ) ) {
					item.removeClass( options.itemsPrevClass )
						.removeClass( options.itemsNextClass )
						.addClass( options.itemsCurrentClass );
				} else if( index > options.position && !item.hasClass( options.itemsNextClass ) ) {
					item.removeClass( options.itemsCurrentClass )
						.removeClass( options.itemsPrevClass )
						.addClass( options.itemsNextClass );
				}
			} );


			//Pre and Post items:
			if( options.infinite === true ) {
				var from, to;

				//Preitems:
				if( options.position < -(options.itemsToDisplay - options.itemsToScroll) ) {
					from = options.numElements - options.itemsToDisplay;
					to = options.numElements;
					if( from >= 0 && from < options.numElements ) {
						options.items.slice( from, to )
							.removeClass( options.itemsPrevClass )
							.removeClass( options.itemsNextClass )
							.addClass( options.itemsCurrentClass );
					}

					options.itemsPre
						.removeClass( options.itemsPrevClass )
						.addClass( options.itemsCurrentClass );
				} else { options.itemsPre.removeClass( options.itemsCurrentClass ).addClass( options.itemsPrevClass ); }

				//Postitems:
				if( options.position >= options.numElements ) {
					from = 0;
					to = options.itemsToDisplay;
					if( to < options.numElements ) {
						options.items.slice( from, to )
							.removeClass( options.itemsPrevClass )
							.removeClass( options.itemsNextClass )
							.addClass( options.itemsCurrentClass );
					}
					options.itemsPost
						.removeClass( options.itemsNextClass )
						.addClass( options.itemsCurrentClass );
				} else { options.itemsPost.removeClass( options.itemsCurrentClass ).addClass( options.itemsNextClass ); }


			}
		}
	};

	var autoplay = function(element, options) {
		if( options.autoplay === true ) {
			slideTo(element, options.autoplayDirection);
			setTimeout( function() { autoplay(element, options); }, options.autoplayPause );
		}
	};

	var stopAutoplay = function(options) {
		options.autoplay = false;
	};

	var refreshSize = function(options) {
		//in the case of orientation vertical, the aspect ratio must stay the same...
		if( options.orientation === ORIENTATION_VERTICAL || options.autoresizeKeepRatio === true ) {
			var width = options.display.parent().width();
			var ratio = options.height / options.width;

			options.width = width;
			options.height = ratio * width;
			options.widthItem = options.width;
			options.heightItem = options.height;

			if( options.orientation === ORIENTATION_VERTICAL ) {
				options.element.width(options.width);
				options.element.height(options.height * options.itemsAll.length);
			} else {
				options.element.width(options.width * options.itemsAll.length);
				options.element.height(options.height);
			}
		} else {
			options.width = options.display.parent().width();
			options.widthItem = options.width;

			options.element.width(options.width * options.itemsAll.length);
		}

		options.display.width(options.width);
		options.display.height(options.height);

		options.itemsAll.width(options.widthItem);
		options.itemsAll.height(options.heightItem);

		applyPosition(options.element, undefined, false);
	};


	/* Private Functions: Utils
	/-------------------------------------------------------------------------*/

	/* Browser Feature Detection:
	* Taken from https://gist.github.com/556448, added "noConflict"-stuff
	* @author https://gist.github.com/jackfuchs
	* @repository GitHub | https://gist.github.com/556448
	* @param p is the requested css-property
	* @param rp defines if the requested property is returned or a
	*			boolean should be the result
	* @param t overrides the target element
	*/
	var hasCssProperty = function(p, rp, t) {
		var
			b = (t) ? t : (document.body || document.documentElement),
			s = b.style,
			v
		;

		// No css support detected
		if(typeof s === 'undefined') { return false; }

		// Tests for standard prop
		if(typeof s[p] === 'string') { return rp ? p : true; }

		// Tests for vendor specific prop
		v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms', 'Icab'];
		p = p.charAt(0).toUpperCase() + p.substr(1);
		for(var i=0; i<v.length; i++) {
			if(typeof s[v[i] + p] === 'string') { return rp ? (v[i] + p) : true; }
		}

		return rp ? undefined : false;
	};

	var getCssProperty = function(element, p) {
		if( element.length > 0 ) {
			p = hasCssProperty(p, true);
			element = element.get(0);
			if( typeof p === 'string' && element !== undefined ) {
				return element.style[ p ];
			}
		}
		return undefined;
	};


	/* Directing
	/-------------------------------------------------------------------------*/
	$.fn.slider = function( method ) {
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || method === undefined ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.slider' );
		}
	};


	/* Constants
	/-------------------------------------------------------------------------*/
	$.slider = $.slider || {};

	$.slider.HORIZONTAL = ORIENTATION_HORIZONTAL;
	$.slider.VERTICAL = ORIENTATION_VERTICAL;

	$.slider.FORWARD = DIRECTION_FORWARD;
	$.slider.BACKWARD = DIRECTION_BACKWARD;

})( jQuery );