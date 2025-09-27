+++
title='{{ replaceRE `\d{4}-\d{2}-\d{2}-(.+)$` `$1` .File.ContentBaseName | title }}'
date={{ .Date }}
slug='{{ replaceRE `\d{4}-\d{2}-\d{2}-(.+)$` `$1` .File.ContentBaseName }}'
draft=true
+++

