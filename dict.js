/*
 Zhongwen - A Chinese-English Pop-Up Dictionary
 Copyright (C) 2019 Christian Schiller
 https://chrome.google.com/extensions/detail/kkmlkkjojmombglmlpbpapmhcaljjkde

 ---

 Originally based on Rikaikun 0.8
 Copyright (C) 2010 Erek Speed
 http://code.google.com/p/rikaikun/

 ---

 Originally based on Rikaichan 1.07
 by Jonathan Zarate
 http://www.polarcloud.com/

 ---

 Originally based on RikaiXUL 0.4 by Todd Rudick
 http://www.rikai.com/
 http://rikaixul.mozdev.org/

 ---

 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

 ---

 Please do not change or remove any of the copyrights or links to web pages
 when modifying any of the files.

 */

'use strict';

export class ZhongwenDictionary {

    // cedict_ts.u8 , cedict.idx, grammarKeywordsMin.json
    constructor(wordDict, wordIndex, grammarKeywords) {
        this.wordDict = wordDict;
        this.wordIndex = wordIndex;
        this.grammarKeywords = grammarKeywords;
        this.cache = {};
    }

    //probably some type of binary search
    static find(needle, haystack) {

        let beg = 0;
        let end = haystack.length - 1;

        while (beg < end) {
            let mi = Math.floor((beg + end) / 2); // first half of the page (in characters)
            let i = haystack.lastIndexOf('\n', mi) + 1; // first half of the page (in lines) including the next line

            let mis = haystack.substr(i, needle.length); // needle.length is almost always less than i, so it returns one character;
            // otherwise, it returns the string and keeps minimizing beg & end until one char
            if (needle < mis) { // when comparing two strings the one occurring with letters closer to alphabet is smaller -- character by character basis,
                // seems that cedict.idx has indexes for each character
                end = i - 1;
            } else if (needle > mis) {
                beg = haystack.indexOf('\n', mi + 1) + 1; // sets beginning to the next line after mi
            } else {
                return haystack.substring(i, haystack.indexOf('\n', mi + 1));
            }
        }

        return null;
    }

    //grammarKeywords is an object from /data/grammerKeywordsMin.json
    hasKeyword(keyword) {
        return this.grammarKeywords[keyword];
    }

    // word will just be the text
    wordSearch(word, max) {

        let entry = { data: [] };

        let dict = this.wordDict;
        let index = this.wordIndex;

        let maxTrim = max || 7; // defaults to 7 

        let count = 0;
        let maxLen = 0;

        WHILE:
            while (word.length > 0) {

                let ix = this.cache[word];
                if (!ix) { 
                    ix = ZhongwenDictionary.find(word + ',', index);
                    if (!ix) {
                        this.cache[word] = [];
                        continue;
                    }
                    ix = ix.split(',');
                    this.cache[word] = ix;
                }

                for (let j = 1; j < ix.length; ++j) { // pre-increment essentially the same as post in this context
                    let offset = ix[j];

                    let dentry = dict.substring(offset, dict.indexOf('\n', offset));

                    if (count >= maxTrim) {
                        entry.more = 1;
                        break WHILE;
                    }

                    ++count;
                    if (maxLen === 0) {
                        maxLen = word.length;
                    }

                    entry.data.push([dentry, word]);
                }

                word = word.substr(0, word.length - 1);
            }

        if (entry.data.length === 0) {
            return null;
        }

        entry.matchLen = maxLen;
        return entry;
    }
}
