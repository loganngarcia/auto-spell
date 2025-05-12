/*
 * Google Analytics tracking.
 */

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-54626118-1']);
// _gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


var trackPageView = function() {
  _gaq.push(['_trackPageview']);
};

var trackEvent = function(category, action) {
  _gaq.push(['_trackEvent', category, action]);
};

var trackEvent = function(category, action, opt_label) {
  _gaq.push(['_trackEvent', category, action,opt_label,'']);
};

var trackEvent = function(category, action, opt_label, opt_value) {
  _gaq.push(['_trackEvent', category, action, opt_label, opt_value]);
};
