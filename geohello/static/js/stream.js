var Placeholders = {

	addPlaceholders : function(props) {

		// default configuration
		var config = {
			'class' : 'placeholder' // apply CSS classes to an input displaying a placeholder
		};

		// if any properties were supplied, apply them to the config object
		for(var key in props) {
			if(config.hasOwnProperty(key)) {
				config[key] = props[key];
			}
		}

		// create a basic form for testing support
		var testform = $('<form><input type="text"></form>');

		// extend jQuery.support() for testing "placeholder" attribute support
		$.extend($.support, {
			placeHolder : !!($('input', testform)[0].placeholder !== undefined || $('input', testform)[0].placeHolder !== undefined)
		});

		// create placeholders by using "value" attribute
		if(!$.support.placeHolder) {
			$('input[placeholder]').each(function() {
				var placeholder = $(this).attr('placeholder');
				$(this).bind({
					'focus' : function() {
						if($(this).val() === placeholder) {
							$(this).val('');
							$(this).removeClass(config['class']);
						}
						$(this).attr('data-focused', 'yes');
					},
					'blur' : function() {
						if($(this).val() === '') {
							$(this).val(placeholder);
							$(this).addClass(config['class']);
						}
						$(this).removeAttr('data-focused');
					}
				});
				// only add placeholder on load when value is empty or placeholder or input is not focused (focus is preserved while reloading/XHR)
				if((($(this).val() === '') || ($(this).val() === placeholder)) && (!$(this).attr('data-focused'))) {
					$(this).val(placeholder);
					$(this).addClass(config['class']);
				}
			});
		}

	}
};

jQuery.fn.vibrate = function(axis, distance, repetition, duration) {

	var i = 0;
	var o = distance / distance;

	switch(axis) {
		case 'x':
			while(i < repetition) {
				$(this).animate({
					marginLeft : '-' + distance + 'px'
				}, duration);
				$(this).animate({
					marginLeft : distance
				}, duration);
				i++;
				if(i == repetition) {
					$(this).animate({
						marginLeft : o
					}, duration);
				}
			}
			break;

		case 'y':
			while(i < repetition) {
				$(this).animate({
					marginTop : '-' + distance + 'px'
				}, duration);
				$(this).animate({
					marginTop : distance
				}, duration);
				i++;
			}
			break;
	}
}
var g_Location = '';
var g_UID = 'user_' + Math.floor(Math.random() * 1001);
var g_UID_Orig = g_UID;
var g_LocationName = '';

function AppendMessageObject(message) {
	var message_item = document.createElement('li');
	message_item.setAttribute('did', message._id);
	message_item.setAttribute('style', 'display: none');

	var innerHtml = '<p class="uid"><span>' + message.uid;
	if('locname' in message) {
		innerHtml += ', from ' + message.locname + '</span> <span class="arrow">&crarr;</span></p><p>' + message.msg + '</p>';
	} else {
		innerHtml += '</span> <span class="arrow">&crarr;</span></p><p>' + message.msg + '</p>';
	}

	message_item.innerHTML = innerHtml;

	$('#stream').append(message_item);
	$(message_item).fadeIn('fast');
}

function HandleInitialMessages(response) {
	// handle the initial messages first.
	HandleNewMessages(response);

	// setup the looping query.
	$.doTimeout(5000, function() {
		$.getJSON('/api/messages', {
			loc : g_Location,
			delta : $('#stream li:last').attr('did'),
			limit : 1
		}, HandleNewMessages);
		return true;
	});
};

function HandleNewMessages(response) {
	response = ( typeof (response) == 'object' ? response : JSON.parse(response));
	var len = response.length;
	while(len--) {
		AppendMessageObject(response[len]);
		document.getElementById('send_message').scrollIntoView();
	}
};

function HandleOwnMessage(response) {
	response = ( typeof (response) == 'object' ? response : JSON.parse(response));
	if(response.ok == 1) {
		AppendMessageObject(response.doc);
		document.getElementById('send_message').scrollIntoView();
	}
};

function HandleFormSubmit(event) {

	event.preventDefault();

	var msg = $('form').children(':first')[0].value, uid = document.getElementById('send_nickname').value, locname = document.getElementById('send_location').value;

	if(uid.length > 2 && uid != g_UID) {
		g_UID = uid;
	} else if(uid.length == 0 && uid != g_UID) {
		g_UID = g_UID_Orig;
	}

	if(locname.length > 2 && locname != g_LocationName) {
		g_LocationName = locname;
	} else if(locname.length == 0) {
		g_LocationName = '';
	}

	// don't do anything if the location is empty, still.
	if(g_Location.length > 0 && msg.length > 0) {
		// submit the new message.
		$.post('/api/messages', {
			uid : g_UID,
			msg : msg,
			loc : g_Location,
			locname : g_LocationName
		}, HandleOwnMessage);
		$('form').children(':first')[0].value = '';
	} else {
		$('form :input:first').vibrate('x', 5, 2, 150);
	}

	return false;
};

function PrepareHeader() {
	var fadeSpeed = 200, fadeTo = 0.5, topDistance = 30;
	var topbarME = function() {
		$('#header').fadeTo(fadeSpeed, 1);
	}, topbarML = function() {
		$('#header').fadeTo(fadeSpeed, fadeTo);
	};
	var inside = false;

	$(window).scroll(function() {
		position = $(window).scrollTop();
		if(position > topDistance && !inside) {
			//add events
			topbarML();
			$('#header').bind('mouseenter', topbarME);
			$('#header').bind('mouseleave', topbarML);
			inside = true;
		} else if(position < topDistance) {
			topbarME();
			$('#header').unbind('mouseenter', topbarME);
			$('#header').unbind('mouseleave', topbarML);
			inside = false;
		}
	});
}


$(document).ready(function() {

	// disable buttons until geolocation is enabled.
	$('form :input').attr('disabled', true);

	// prepare the header.
	PrepareHeader();

	// do placeholders.
	Placeholders.addPlaceholders();

	// do not do anything unless this browser supports geolocation.
	if(navigator.geolocation) {

		// obtain the user's location.
		navigator.geolocation.getCurrentPosition(function(position) {

			$('#loading').css('display', 'none');

			// store it globally.
			g_Location = position.coords.longitude + ',' + position.coords.latitude;

			// enable creation of new messages.
			$('form').submit(HandleFormSubmit);

			// enable the form for sending of messages.
			$('form :input').removeAttr('disabled');

			// query for all messages in this location.
			$.getJSON('/api/messages', {
				loc : g_Location
			}, HandleInitialMessages);

			// begin watching for location coordinate changes.
			var positionTimer = navigator.geolocation.watchPosition(function(position) {
				g_Location = position.coords.longitude + ',' + position.coords.latitude;
			});
		}, function(err) {
			$('#loading').css('display', 'none');
			$('#stream').append('<li><p>Your browser supports the required geolocation functionality, but encountered an error while locating your position. (error code: ' + err.code + ')</p></li>');
		}, {
			timeout : 60000,
			enableHighAccuracy : true
		});

	} else {
		$('#loading').css('display', 'none');
		$('#stream').append('<li><p>The browser you are using does not support the required geolocation functionality. This requirement is being removed in the future.</p></li>');
	}

});
