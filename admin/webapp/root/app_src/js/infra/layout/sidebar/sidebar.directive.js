/**=========================================================
 * Sidebar menu directive
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.sidebar')
        .directive('sidebar', sidebar);

    sidebar.$inject = ['$rootScope', '$timeout', '$window', 'Utils'];
    function sidebar ($rootScope, $timeout, $window, Utils) {

        let $win = angular.element($window);

        const hideMobileSidebarMenu = () => {
            $('.dropdown-backdrop').remove();
            $('.sidebar-subnav.nav-floating').remove();
            $('.sidebar li.open').removeClass('open');
        };

        const sidebarAddBackdrop = () => {
            let $backdrop = $('<div/>', {'class': 'dropdown-backdrop'});
            $backdrop.insertAfter('.aside-inner').on('click mouseenter', function () {
                hideMobileSidebarMenu();
            });
        };

        const toggleMiniSubmenu = element => {
            element.siblings('li').removeClass('open');
            element.toggleClass('open');
        };

        const toggleMiniMenuItem = ($listItem, $sidebar) => {

            hideMobileSidebarMenu();

            const ul = $listItem.children('ul');

            if (!ul.length) return $();
            if ($listItem.hasClass('open')) {
                toggleMiniSubmenu($listItem);
                return $();
            }

            const $aside = $('.aside');
            const $asideInner = $('.aside-inner');
            const mar = parseInt($asideInner.css('padding-top'), 0) + parseInt($aside.css('padding-top'), 0);
            const subNav = ul.clone().appendTo($aside);

            toggleMiniSubmenu($listItem);

            const itemTop = ($listItem.position().top + mar) - $sidebar.scrollTop();
            const vwHeight = $win.height();

            subNav
                .addClass('nav-floating')
                .css({
                    position: $rootScope.app.layout.isFixed ? 'fixed' : 'absolute',
                    top: itemTop,
                    bottom: (subNav.outerHeight(true) + itemTop > vwHeight) ? 0 : 'auto'
                });

            subNav.on('mouseleave', function () {
                toggleMiniSubmenu($listItem);
                subNav.remove();
            });

            return subNav;
        };

        const link = (scope, element, attrs) => {
            let currentState = $rootScope.$state.current.name;
            let subNav = $();

            const sidebarToggleOff = () => {
                $rootScope.app.asideToggled = false;
                if (!scope.$$phase) scope.$apply();
            };

            const watchOutsideClicks = newVal => {
                let sidebarOnClickEvent = 'click.sidebar';
                let wrapper = $('.sidebar-content');
                if (newVal === true) {
                    $timeout(function () {
                        wrapper.on(sidebarOnClickEvent, e => {
                            if (!$(e.target).parents('.aside').length) {
                                sidebarToggleOff();
                            }
                        });
                    });
                } else {
                    wrapper.off(sidebarOnClickEvent);
                }
            };

            element.on(Utils.isTouchable() ? 'click' : 'mouseenter', '.nav > li', function () {
                if (Utils.isSubmenuCollapsed() || $rootScope.app.layout.asideHover) {
                    subNav.trigger('mouseleave');
                    subNav = toggleMiniMenuItem($(this), element);
                    sidebarAddBackdrop();
                }
            });

            scope.$on('hideMobileSidebarMenu', () => {
                hideMobileSidebarMenu();
            });

            $win.on('resize', () => {
                if (!Utils.isOnMobile()) sidebarToggleOff();
            });

            $rootScope.$on('$stateChangeStart', (event, toState) => {
                currentState = toState.name;
                sidebarToggleOff();

                $rootScope.$broadcast('hideMobileSidebarMenu');
            });

            if (angular.isDefined(attrs.sidebarAnyclickClose)) {
                $rootScope.$watch('app.asideToggled', watchOutsideClicks);
            }
        };

        return {
            link: link,
            restrict: 'EA',
            template: '<nav class="sidebar" ng-transclude></nav>',
            transclude: true,
            replace: true
        };
    }
})();
