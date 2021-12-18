(function () {
  "use strict";

  angular
    .module('app.common')
    .directive('curtainPanel', DashboardHeading);
  /*Use case:
           <curtain-panel html-content="{{html}}" width="70" height="200" button-top="10" button-right="10"></curtain-panel>
            attribute: html-content - If $sce.trustAsHtml applied, developer can pass html with style and script
                       width: Percentage value
                       height: Absolute pixel value
                       button-top/bottom/left/right: Absolute pixel value for info button position

           !!(Issue existing now) <curtain-panel html-content="{{html}}" width="70" height="200" ></curtain-panel>
  */

  DashboardHeading.$inject = [
    "$sanitize",
    "$timeout"
  ];
  function DashboardHeading(
    $sanitize,
    $timeout
  ) {
    return {
      restrict: "EA",
      templateUrl: "/app/views/components/curtain-panel.html",
      scope: {
        htmlContent: "@",
        dimension: "@",
        top: "@",
        type: "@",
        buttonPosition: "@"
      },
      link: function(scope, element, attributes) {
        let transformOrigin = "top";
        let timer = null;
        if (attributes.type !== "drag-down" && attributes.type !== "info-click") {
          scope.type = "info-click";
        } else {
          scope.type = attributes.type;
        }
        scope.isShowingSummary = false;//attributes.defaultOpen === "true";
        scope.htmlContent = $sanitize(attributes.htmlContent);
        scope.dimension = {
          width: `${attributes.width}%`,
          height: scope.isShowingSummary ? `${attributes.height}px` : "0",
          transform: scope.isShowingSummary ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: transformOrigin,
          transition: "all .5s ease",
          left: `calc(50% - ${attributes.width / 2}%)`
        }
        scope.top = {
          top: scope.isShowingSummary ? `${attributes.height}px` : "0",
          transition: "all .5s ease"
        }

        scope.buttonPosition = {
          position: "absolute",
          top: `${attributes.buttonTop}px` || "0",
          left: `${attributes.buttonLeft}px` || "0",
          right: `${attributes.buttonRight}px` || "0",
          bottom: `${attributes.buttonBottom}px` || "0"
        }

        const toggle = function(open) {
          if (open) {
            if (timer) $timeout.cancel(timer)
            scope.dimension = {
              width: `${attributes.width}%`,
              height: `${attributes.height}px`,
              transform: "scaleY(1)",
              transformOrigin: transformOrigin,
              transition: "all .5s ease",
              left: `calc(50% - ${attributes.width / 2}%)`
            }
            scope.top = {
              top: `${attributes.height}px`,
              transition: "all .5s ease"
            }
          } else {
            timer = $timeout(function() {
              scope.dimension = {
                width: `${attributes.width}%`,
                height: `${attributes.height}px`,
                transform: "scaleY(0)",
                transformOrigin: transformOrigin,
                transition: "all .5s ease",
                left: `calc(50% - ${attributes.width / 2}%)`
              }
              scope.top = {
                top: "0",
                transition: "all .5s ease"
              }
            },2000);
          }

        }

        // const globalClick = function(ev) {
        //   ev.stopPropagation();
        //   scope.isShowingSummary = false;
        //   toggle();
        // }

        scope.toggleSummary = function(ev, open) {
          ev.stopPropagation();
          toggle(open);
          // if (scope.isShowingSummary) {
          //   document.body.addEventListener("click", globalClick);
          // } else {
          //   document.body.removeEventListener("click", globalClick);
          // }
        }

        // scope.$on("destroy", function() {
        //   document.body.removeEventListener("click", globalClick);
        // });
      }
    }
  }

})();
