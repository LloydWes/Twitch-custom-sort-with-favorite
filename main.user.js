// ==UserScript==
// @name         Custom channel sort with favorites
// @namespace    https://github.com/tomasz13nocon
// @version      1.1
// @description  Reorders the followed channels list in the sidebar based on viewcount or alphabetical order, allows to place favorites on the top of the list.
// @author       Lloyd WESTBURY
// @match        https://www.twitch.tv/*
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_deleteValue
// @grant GM_listValues
// @grant GM_registerMenuCommand
// @grant GM_addStyle
// @run-at document-start
// @homepageURL  https://github.com/LloydWes/Twitch-custom-sort-with-favorite
// @downloadURL https://update.greasyfork.org/scripts/517225/Custom%20channel%20sort%20with%20favorites.user.js
// @updateURL https://update.greasyfork.org/scripts/517225/Custom%20channel%20sort%20with%20favorites.meta.js
// @license      MIT
// ==/UserScript==

(async function () {

    'use strict';

    function findReact(dom) {
        if (dom[Object.keys(dom).find(a=>a.startsWith("__reactProps$"))].children) {
            return dom[Object.keys(dom).find(a=>a.startsWith("__reactProps$"))].children;
        }
        else {
            return dom[Object.keys(dom).find(a=>a.startsWith("__reactInternalInstance$"))].pendingProps.children;
        }
    }

    function waitForElement(querySelector) {
        return new Promise((resolve, reject) => {
            if (document.querySelectorAll(querySelector).length) resolve();
            const observer = new MutationObserver(() => {
                if (document.querySelectorAll(querySelector).length) {
                    observer.disconnect();
                    return resolve();
                }
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    let callback = null;
    function mettreAJourCallback() {
        if (GM_getValue("alpha")) { 
            callback = (a, b) => {
                let an = getNameWhatever(a);
                let bn = getNameWhatever(b);
                return ('' + an).localeCompare(bn);
            };
        } else {
            callback = (a, b) => {
                return viewcount(b) - viewcount(a);
            }
        }
    }

    async function ajouterBoutonEtLancerTrie() {
        let e;
        let followedSectionButton;
        let g;
        
        while(!(e = document.querySelector("[data-a-target='side-nav-header-expanded']"))) await wait(200);
        while(!(followedSectionButton = document.querySelector(".followed-side-nav-header--expanded"))) await wait(200);
        while(!(g = document.querySelector(".followed-side-nav-header__dropdown-trigger"))) await wait(200);
        let followedButtonCallBack = (event) => {
            GM_setValue("alpha", !GM_getValue("alpha"));
            g.firstElementChild.lastElementChild.innerHTML = GM_getValue("alpha") ? "Alpha" : "Spec";
            let svgHolder = g.lastElementChild.lastElementChild.lastElementChild.lastElementChild.lastElementChild;
            let path = document.createElement('path');
            if (GM_getValue("alpha")) {
                svgHolder.setAttribute('d', 'M14.94 4.66h-4.72l2.36-2.36 2.36 2.36zm-4.69 14.71h4.66l-2.33 2.33-2.33-2.33zM6.1 6.27L1.6 17.73h1.84l.92-2.45h5.11l.92 2.45h1.84L7.74 6.27H6.1zm-1.13 7.37l1.94-5.18 1.94 5.18H4.97zm10.76 2.5h6.12v1.59h-8.53v-1.29l5.92-8.56h-5.88v-1.6h8.3v1.26l-5.93 8.6z');
            } else {
                svgHolder.setAttribute('d', 'M11 6 7 2 3 6l1.5 1.5L6 6v6h2V6l1.5 1.5L11 6Zm6 8-4 4-4-4 1.5-1.5L12 14V8h2v6l1.5-1.5L17 14Z');
            }
            getStreamsAndSortThem();
            event.stopImmediatePropagation();
        }
        g.addEventListener('click', (e) => {
            e.stopImmediatePropagation();
        });
        followedSectionButton.addEventListener('click', followedButtonCallBack, true);
        g.firstElementChild.lastElementChild.innerHTML = GM_getValue("alpha") ? "Alpha" : "Spec";
        let svgHolder = g.lastElementChild.lastElementChild.lastElementChild.lastElementChild.lastElementChild;
        if (GM_getValue("alpha")) {
            svgHolder.setAttribute('d', 'M14.94 4.66h-4.72l2.36-2.36 2.36 2.36zm-4.69 14.71h4.66l-2.33 2.33-2.33-2.33zM6.1 6.27L1.6 17.73h1.84l.92-2.45h5.11l.92 2.45h1.84L7.74 6.27H6.1zm-1.13 7.37l1.94-5.18 1.94 5.18H4.97zm10.76 2.5h6.12v1.59h-8.53v-1.29l5.92-8.56h-5.88v-1.6h8.3v1.26l-5.93 8.6z');
        } else {
            svgHolder.setAttribute('d', 'M11 6 7 2 3 6l1.5 1.5L6 6v6h2V6l1.5 1.5L11 6Zm6 8-4 4-4-4 1.5-1.5L12 14V8h2v6l1.5-1.5L17 14Z');
        }

    }
    let sidebar;
    let boutonAjouteEtTrie = false;

    while ((sidebar = document.getElementsByClassName("side-bar-contents")[0]) === undefined) {
        await new Promise(r => setTimeout(r, 500));
    }




    let weMutatedDom = false;
    let mutationSideBar = new MutationObserver((mutations) => {
        let fo = document.querySelectorAll(".side-nav-section .tw-transition-group")
        if (fo.length) {
            let bar = document.createElement("div");
            bar.classList.add("truc");
            weMutatedDom = true;
            let div1 = document.createElement("div");
            let div2 = document.createElement("div");
            let div3 = document.createElement("div");
            div3.classList.add("side-nav-card")
            div1.classList.add("mbar");
            div1.style.cssText = "transition-property: transform, opacity; transition-timing-function: ease; border-bottom: 3px solid #bf94ff;"
            div1.appendChild(div2);
            div2.appendChild(div3);

            fo[0].appendChild(div1);

            mutationSideBar.disconnect();
        }
    });
    mutationSideBar.observe(sidebar, {attributes: false, childList: true, subtree: true, characterData: true });
    let getStreamsAndSortThem = (mutations) => {
        mettreAJourCallback();
        if (weMutatedDom) {
            weMutatedDom = false;
            return;
        }

        // We're only interested in "new nodes added" and "text changed" mutations.
        let relevantMutation = false;

        if (mutations && mutations.length) {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes[0] || mutation.type === "characterData") {
                    relevantMutation = true;
                }
            });
        } else {
            relevantMutation = true;
        }
        if (!relevantMutation) return;

        let followedSection = sidebar.getElementsByClassName("side-nav-section")[0];

        // Mapping to 2 parents up, as that's the outermost element for a single channel
        let streams = [...followedSection.querySelectorAll(".side-nav-section div:not(:first-child) div.side-nav-card")].map(el => el.parentNode.parentNode);

            streams.sort((a, b) => {
                let aIsBar = isBar(a);
                let bIsBar = isBar(b);
                if (aIsBar) {
                    let bOnline = isOnline(b);
                    if (bOnline && isFav(b)) {
                        return 1;
                    } else {
                        return -1;
                    }
                } else if (bIsBar) {
                    let aOnline = isOnline(a);
                    if (aOnline && isFav(a)) {
                        return -1;
                    } else {
                        return 1;
                    }
                }
                let aOnline = isOnline(a);
                let bOnline = isOnline(b);
                if (aOnline && bOnline) {
                    let aIsFav = isFav(a);
                    let bIsFav = isFav(b);
                    if (aIsFav && bIsFav) {
                        return callback(a,b);
                    } else if (aIsFav) {
                        return -1;
                    } else if (bIsFav) {
                        return 1;
                    } else {
                        return callback(a,b);
                    }
                } else if (aOnline || bOnline) {
                    let aIsFav = isFav(a);
                    let bIsFav = isFav(b);
                    if (aOnline) {
                        return -1;
                    } else if (bOnline) {
                        return 1;
                    } else if (aIsFav) {
                            return -1;
                    } else if (bIsFav) {
                            return 1;
                    } else {
                        return 0;
                    }
                }
            });


        weMutatedDom = true;
        streams[0].parentNode.append(...streams);
        if (!boutonAjouteEtTrie) {
            ajouterBoutonEtLancerTrie();
            boutonAjouteEtTrie = true;
        }
    }

    function isBar(el) {
        return el.classList.contains("mbar")
    }
    function isFav(a) {
        return GM_getValue(getNameWhatever(a).toLowerCase(), undefined) ? 1 : 0;
    }

    function getNameWhatever(element) {
        let component = findReact(element);
        // If "stream" property doesn't exist (optional chaining below) then the stream is offline.
        if (component.props.stream) {
            return component
                .props.stream
                .user.login;
        } else {
            return component
                .props.videoConnection
                .user.login;
        }
    }

    function isOnline(element) {
        let component = findReact(element);
        // If "stream" property doesn't exist (optional chaining below) then the stream is offline.
        if (component.props.stream) {
            return 1
        } else {
            return 0;
        }
    }

    function viewcount(element) {
        let component = findReact(element);
        // If "stream" property doesn't exist (optional chaining below) then the stream is offline.
        if (component.props.stream) {
            return component
                .props.stream
                .content.viewersCount;
        } else {
            return null;
        }
    }

    new MutationObserver(getStreamsAndSortThem).observe(sidebar, {attributes: false, childList: true, subtree: true, characterData: true });


    let clickedEl = null;
    document.addEventListener("contextmenu", function(event){
        clickedEl = event.target;
    });

    GM_registerMenuCommand("toggle favorite", () => {
        if(clickedEl) {
            let e = clickedEl;
            let limit = 10;
            while (!e.classList.contains("side-nav-card")) {
                e = e.parentNode;
                limit--;
                if (limit <= 0) break;
            }
            let n = getNameWhatever(e.parentNode.parentNode);
            let currentValue = GM_getValue(n)
            if (currentValue) {
                GM_deleteValue(n);
            }
            else {
                GM_setValue(n, 1);
            }
            getStreamsAndSortThem();
            clickedEl = null;
        }
    });
    const wait = async (ms) => { await new Promise((resolve) => { setTimeout(resolve, ms); });}
}());
