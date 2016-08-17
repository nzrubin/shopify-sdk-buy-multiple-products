$(function() {

  /* Build new ShopifyBuy client
  ============================================================ */
	var client = ShopifyBuy.buildClient({
        apiKey: 'b6857759ca910e644416ca2f0d678dac',
        myShopifyDomain: 'rocketproducts',
        appId: '6'
    });

  var product;
  var cart;
  var cartLineItemCount;
  if(localStorage.getItem('lastCartId')) {
    client.fetchCart(localStorage.getItem('lastCartId')).then(function(remoteCart) {
      cart = remoteCart;
      cartLineItemCount = cart.lineItems.length;
      renderCartItems();
    });
  } else {
    client.createCart().then(function (newCart) {
      cart = newCart;
      localStorage.setItem('lastCartId', cart.id);
      cartLineItemCount = 0;
    });
  }

  var previousFocusItem;
  
  var htmlBlock;

  
  
						/* 
						=========================================================
						===== BY VLAD : ROLL COLLECTIONS ID AND PRODUCTS ID =====
						===== BY VLAD : ROLL COLLECTIONS ID AND PRODUCTS ID =====
						===== BY VLAD : ROLL COLLECTIONS ID AND PRODUCTS ID =====
						===== BY VLAD : ROLL COLLECTIONS ID AND PRODUCTS ID =====
						*/
						client.fetchAllCollections().then(function(value){				
							for (var key in value) {
							  if (value.hasOwnProperty(key)) {					  
								//console.log('collection id is: '+value[key].attrs.collection_id);
								rollProducts(value[key].attrs.collection_id);
								}
							}		
						});
				
				
						/* ROLL PRODUCTS FUNCTION */
						function rollProducts(collection_id){				
							client.fetchQueryProducts({collection_id: collection_id}).then(function(products) {
		/*list all products */
		//ddd = JSON.stringify(products, null, 4);
		//console.log(ddd);

							
								for (var key in products) {
								  if (products.hasOwnProperty(key)) {						  
									//console.log('product id is: '+products[key].attrs.product_id);
									console.log('variant id is: '+products[key].variants[0].id);
									prID = products[key].attrs.product_id;
									variantId = products[key].variants[0].id;
									getProducts(prID,variantId);
								
										}
								}				  
							});			
						}
						/* 
						========= END BY VLAD ===================
						========= END BY VLAD ===================
						========= END BY VLAD ===================
						========= END BY VLAD ===================
						=========================================
						*/
	
	
	
	function getProducts(prID,variantId){
		  /* Fetch product and init
		  ============================================================ */
		  client.fetchProduct(prID).then(function (fetchedProduct) {
			  
			  
						//ddd = JSON.stringify(fetchedProduct, null, 4);				  
						//console.log(ddd+'*******************************')
			  
			  
			product = fetchedProduct;
			var selectedVariant = product.selectedVariant;
			
				ddd = JSON.stringify(selectedVariant, null, 4);
				//console.log(ddd);
			
			
			var selectedVariantImage = product.selectedVariantImage;
			var currentOptions = product.options;
			
			
			
			var variantSelectors = generateSelectors(product);
			$('#p_'+prID+' .variant-selectors').html(variantSelectors); /* insert variants block */
			
			
			
				updateProductTitle(product.title,prID);
				updateVariantImage(selectedVariantImage,prID);
				updateVariantTitle(selectedVariant,prID);
				updateVariantPrice(selectedVariant,prID);
				
				attachOnVariantSelectListeners(product,prID);
				updateCartTabButton();
				bindEventListeners();
			
		  });
		  
		  htmlProductBlock(prID,variantId); /* insert html block */
		  
	}
	
	
	
	
	
	function htmlProductBlock(prID,variantId){
		
		htmlBlock='<div class="product" id="p_'+prID+'">\
		<img class="variant-image">\
		<h1 class="product-title"></h1>\
		<h2 class="variant-title"></h2>\
		<h2 class="variant-price"></h2>\
		<div class="variant-selectors"></div>\
		<button id="'+variantId+'" class="buy-button js-prevent-cart-listener">Add To Cart</button>\
		</div>';
		
		$('#roll').append(htmlBlock)
		
	}
  
  
  


  /* Generate DOM elements for variant selectors
  ============================================================ */
  function generateSelectors(product) {
    var elements = product.options.map(function(option) {
      return '<select name="' + option.name + '">' + option.values.map(function(value) {
        return '<option value="' + value + '">' + value + '</option>';
      }) + '</select>';
    });

    return elements;
  }


  /* Bind Event Listeners
  ============================================================ */
  function bindEventListeners() {
    /* cart close button listener */
    $('.cart .btn--close').on('click', closeCart);

    /* click away listener to close cart */
    $(document).on('click', function(evt) {
      if((!$(evt.target).closest('.cart').length) && (!$(evt.target).closest('.js-prevent-cart-listener').length)) {
        closeCart();
      }
    });

    /* escape key handler */
    var ESCAPE_KEYCODE = 27;
    $(document).on('keydown', function (evt) {
      if (evt.which === ESCAPE_KEYCODE) {
        if (previousFocusItem) {
          $(previousFocusItem).focus();
          previousFocusItem = ''
        }
        closeCart();
      }
    });

    /* checkout button click listener */
    $('.btn--cart-checkout').on('click', function () {
      window.open(cart.checkoutUrl, '_self');
    });

		/* buy button click listener */
		//$('.buy-button').on('click', buyButtonClickHandler); // original
		
		$('.buy-button').on('click', { prID: $('button').id }, buyButtonClickHandler); // to pass unique id to event handler function

		

    /* increment quantity click listener */
    $('.cart').on('click', '.quantity-increment', function () {
      var variantId = $(this).data('variant-id');
      incrementQuantity(variantId);
    });

    /* decrement quantity click listener */
    $('.cart').on('click', '.quantity-decrement', function() {
      var variantId = $(this).data('variant-id');
      decrementQuantity(variantId);
    });

    /* update quantity field listener */
    $('.cart').on('keyup', '.cart-item__quantity', debounce(fieldQuantityHandler, 250));

    /* cart tab click listener */
    $('.btn--cart-tab').click(function() {
      setPreviousFocusItem(this);
      openCart();
    });
  }


  /* Variant option change handler
  ============================================================ */
  function attachOnVariantSelectListeners(product,prID) {
    $('#p_'+prID+' .variant-selectors').on('change', 'select', function(event) {
      var $element = $(event.target);
      var name = $element.attr('name');
      var value = $element.val();
      product.options.filter(function(option) {
        return option.name === name;
      })[0].selected = value;

      var selectedVariant = product.selectedVariant;
      var selectedVariantImage = product.selectedVariantImage;
      updateProductTitle(product.title,prID);
      updateVariantImage(selectedVariantImage,prID);
      updateVariantTitle(selectedVariant,prID);
      updateVariantPrice(selectedVariant,prID);
    });
  }

  /* Update product title
  ============================================================ */
  function updateProductTitle(title,prID) {
    $('#p_'+prID+' .product-title').text(title);
  }

  /* Update product image based on selected variant
  ============================================================ */
  function updateVariantImage(image,prID) {
    var src = (image) ? image.src : ShopifyBuy.NO_IMAGE_URI;

    $('#p_'+prID+' .variant-image').attr('src', src);
  }

  /* Update product variant title based on selected variant
  ============================================================ */
  function updateVariantTitle(variant,prID) {
    $('#p_'+prID+' .variant-title').text(variant.title);
  }

  /* Update product variant price based on selected variant
  ============================================================ */
  function updateVariantPrice(variant,prID) {
    $('#p_'+prID+' .variant-price').text('$' + variant.price);
  }

  /* Attach and control listeners onto buy button
  ============================================================ */
  function buyButtonClickHandler(evt) {
	 
    evt.preventDefault();
	
	 evt.stopImmediatePropagation();
	 
	 // variantId = evt.target.id;
   
   //var id = product.selectedVariant.id;
   var id = evt.target.id;
	
	
		
		//prID = evt.target.id;
		console.log(evt.target.id+'----------'+product.attrs.product_id+'-----------'+product.selectedVariant.id+'----'+variantId)
		//prID = evt.target.id; 
		
		
		//ddd = JSON.stringify(product, null, 4);
		//console.log(ddd);
		
	
			
			   var quantity;
				var cartLineItem = findCartItemByVariantId(id);

				quantity = cartLineItem ? cartLineItem.quantity + 1 : 1;

				addOrUpdateVariant(product.selectedVariant, quantity);
				setPreviousFocusItem(evt.target);
				$('#checkout').focus();
		
		
 
  }

  /* Update product variant quantity in cart
  ============================================================ */
  function updateQuantity(fn, variantId) {
    var variant = product.variants.filter(function (variant) {
      return (variant.id === variantId);
    })[0];
    var quantity;
    var cartLineItem = findCartItemByVariantId(variant.id);
    if (cartLineItem) {
      quantity = fn(cartLineItem.quantity);
      updateVariantInCart(cartLineItem, quantity);
    }
  }

  /* Decrease quantity amount by 1
  ============================================================ */
  function decrementQuantity(variantId) {
    updateQuantity(function(quantity) {
      return quantity - 1;
    }, variantId);
  }

  /* Increase quantity amount by 1
  ============================================================ */
  function incrementQuantity(variantId) {
    updateQuantity(function(quantity) {
      return quantity + 1;
    }, variantId);
  }

  /* Update producrt variant quantity in cart through input field
  ============================================================ */
  function fieldQuantityHandler(evt) {
    var variantId = parseInt($(this).closest('.cart-item').attr('data-variant-id'), 10);
    var variant = product.variants.filter(function (variant) {
      return (variant.id === variantId);
    })[0];
    var cartLineItem = findCartItemByVariantId(variant.id);
    var quantity = evt.target.value;
    if (cartLineItem) {
      updateVariantInCart(cartLineItem, quantity);
    }
  }

  /* Debounce taken from _.js
  ============================================================ */
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    }
  }

  /* Open Cart
  ============================================================ */
  function openCart() {
    $('.cart').addClass('js-active');
  }

  /* Close Cart
  ============================================================ */
  function closeCart() {
    $('.cart').removeClass('js-active');
    $('.overlay').removeClass('js-active');
  }

  /* Find Cart Line Item By Variant Id
  ============================================================ */
  function findCartItemByVariantId(variantId) {
    return cart.lineItems.filter(function (item) {
      return (item.variant_id === variantId);
    })[0];
  }

  /* Determine action for variant adding/updating/removing
  ============================================================ */
  function addOrUpdateVariant(variant, quantity) {
    openCart();
    var cartLineItem = findCartItemByVariantId(variant.id);

    if (cartLineItem) {
      updateVariantInCart(cartLineItem, quantity);
    } else {
      addVariantToCart(variant, quantity);
    }

    updateCartTabButton();
  }

  /* Update details for item already in cart. Remove if necessary
  ============================================================ */
  function updateVariantInCart(cartLineItem, quantity) {
    var variantId = cartLineItem.variant_id;
    var cartLength = cart.lineItems.length;
    cart.updateLineItem(cartLineItem.id, quantity).then(function(updatedCart) {
      var $cartItem = $('.cart').find('.cart-item[data-variant-id="' + variantId + '"]');
      if (updatedCart.lineItems.length >= cartLength) {
        $cartItem.find('.cart-item__quantity').val(cartLineItem.quantity);
        $cartItem.find('.cart-item__price').text(formatAsMoney(cartLineItem.line_price));
      } else {
        $cartItem.addClass('js-hidden').bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function() {
           $cartItem.remove();
        });
      }

      updateCartTabButton();
      updateTotalCartPricing();
      if (updatedCart.lineItems.length < 1) {
        closeCart();
      }
    }).catch(function (errors) {
      console.log('Fail');
      console.error(errors);
    });
  }

  /* Add 'quantity' amount of product 'variant' to cart
  ============================================================ */
  function addVariantToCart(variant, quantity) {
    openCart();

    cart.addVariants({ variant: variant, quantity: quantity }).then(function() {
      var cartItem = cart.lineItems.filter(function (item) {
        return (item.variant_id === variant.id);
      })[0];
      var $cartItem = renderCartItem(cartItem);
      var $cartItemContainer = $('.cart-item-container');
      $cartItemContainer.append($cartItem);
      setTimeout(function () {
        $cartItemContainer.find('.js-hidden').removeClass('js-hidden');
      }, 0)

    }).catch(function (errors) {
      console.log('Fail');
      console.error(errors);
    });

    updateTotalCartPricing();
    updateCartTabButton();
  }

  /* Return required markup for single item rendering
  ============================================================ */
  function renderCartItem(lineItem) {
    var lineItemEmptyTemplate = $('#CartItemTemplate').html();
    var $lineItemTemplate = $(lineItemEmptyTemplate);
    var itemImage = lineItem.image.src;
    $lineItemTemplate.attr('data-variant-id', lineItem.variant_id);
    $lineItemTemplate.addClass('js-hidden');
    $lineItemTemplate.find('.cart-item__img').css('background-image', 'url(' + itemImage + ')');
    $lineItemTemplate.find('.cart-item__title').text(lineItem.title);
    $lineItemTemplate.find('.cart-item__variant-title').text(lineItem.variant_title);
    $lineItemTemplate.find('.cart-item__price').text(formatAsMoney(lineItem.line_price));
    $lineItemTemplate.find('.cart-item__quantity').attr('value', lineItem.quantity);
    $lineItemTemplate.find('.quantity-decrement').attr('data-variant-id', lineItem.variant_id);
    $lineItemTemplate.find('.quantity-increment').attr('data-variant-id', lineItem.variant_id);

    return $lineItemTemplate;
  }

  /* Render the line items currently in the cart
  ============================================================ */
  function renderCartItems() {
    var $cartItemContainer = $('.cart-item-container');
    $cartItemContainer.empty();
    var lineItemEmptyTemplate = $('#CartItemTemplate').html();
    var $cartLineItems = cart.lineItems.map(function (lineItem, index) {
      return renderCartItem(lineItem);
    });
    $cartItemContainer.append($cartLineItems);

    setTimeout(function () {
      $cartItemContainer.find('.js-hidden').removeClass('js-hidden');
    }, 0)
    updateTotalCartPricing();
  }

  /* Update Total Cart Pricing
  ============================================================ */
  function updateTotalCartPricing() {
    $('.cart .pricing').text(formatAsMoney(cart.subtotal));
  }

  /* Format amount as currency
  ============================================================ */
  function formatAsMoney(amount) {
    return '$' + parseFloat(amount, 10).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString();
  }

  /* Update cart tab button
  ============================================================ */
  function updateCartTabButton() {
    if (cart.lineItems.length > 0) {
      $('.btn--cart-tab .btn__counter').html(cart.lineItemCount);
      $('.btn--cart-tab').addClass('js-active');
    } else {
      $('.btn--cart-tab').removeClass('js-active');
      $('.cart').removeClass('js-active');
    }
  }

  /* Set previously focused item for escape handler
  ============================================================ */
  function setPreviousFocusItem(item) {
    previousFocusItem = item;
  }

});






	
				/*
				========== vlad
				========== vlad
				========== vlad
				========== vlad
						
						307340358 --- collection ID
						
				7214768454		  --- product 1 ID

				7214774214		  --- product 2 ID

				7214798278		  --- product 3 ID
				
				
				
					
				// FETCH ALL COLLECTION INFO			
				client.fetchAllCollections().then(function(value){				
					for (var key in value) {
					  if (value.hasOwnProperty(key)) {					  
						console.log(value[key].attrs.collection_id);
							}
					}		
				})
	
	
	
				client.fetchQueryProducts({collection_id: 307340358}).then(function(products) {
				  
				  // ddd = JSON.stringify(products[0].attrs, null, 4);
				  
				  // console.log(products[0].attrs.product_id)

				  // prID = products[0].attrs.product_id;
					
				for (var key in products) {
				  if (products.hasOwnProperty(key)) {
					  
					console.log(products[key].attrs.product_id);
					// return products[0].attrs.product_id;
					
					
					dd = products[key].attrs.product_id;
					//return dd;
				  
							document.getElementById("demo").innerHTML = dd;
						}
				}
				  
				  
				});	

				
				
				
				client.fetchQueryProducts({ collection_id: 307340358}).then(products => {
				  console.log(products); // An array of products in collection 123
				});
		
				
			
				==== END END 
				==== END END 
				==== END END 
				==== END END 
				*/


















