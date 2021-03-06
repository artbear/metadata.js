# metadata.js: 1С-подобный движок данных и метаданных

[English version](README.en.md)

## Предпосылки
Проект задумывался, как альтернативный лёгкий javascript клиент 1С, позволяющий читать и редактировать данные, расположенные на [сервере 1С](http://v8.1c.ru/overview/Term_000000033.htm) с большим числом клиентских подключений (дилеры или интернет-витрина с сотнями анонимных либо авторизованных внешних пользователей).

Стандартный web-клиент 1С для реализации проекта [Заказ дилера](https://light.oknosoft.ru/) не проходил по ряду ограничений:
- Дорого (> млн.руб. за 300-500 клиентских лицензий)
- Медленно на реальных (плохих) интернет-каналах
- Небезопасно пускать гостей и дилеров в управленческую учетную базу. RLS и группы доступа никто не отменял, но система, в которой к критичным данным нельзя обратиться в принципе, будет надежнее системы, где доступ к этим данным ограничен паролем.

Из ограничений вытекали цели:
- Не нарушая лицензионного соглашения с [фирмой 1С](http://www.1c.ru/eng/title.htm), предоставить дешевые подключения из расчета 300-500 пользователей на один физический [сервер 1С](http://1c-dn.com/1c_enterprise/what_is_1c_enterprise/)
- Обеспечить приемлемое быстродействие за счет:
   + Отказа от избыточной для большинства проектов функциональности стандартного *клиента 1С*
   + Кеширования html5
   + Оптимизации вычислений на стороне браузера

## Web-приложение к серверу 1С - это просто
- Подключите скрипт с файлами описания метаданных (см. демо) и получите полнофункциональное приложение с бизнес-логикой, реализованной средствами 1С в конфигураторе 1С и отзывчивым интерфейсом, который автоматически сгенерирует библиотека metadata.js
- С фреймворком metadata.js легко создавать системы на сотни и даже тысячи рабочих мест, используя высокоуровневые инструменты платформы 1С на сервере, сочетая их с гибкостью, эффективностью и доступностью браузерных технологий

### Для типовых конфигураций на полной поддержке используется rest-сервис odata
Файлы описания метаданных, в этом случае, формируются внешней обработкой, входящей в комплект поставки

### Если внесение изменений в типовую конфигурацию допустимо, используется http-сервис библиотеки интеграции
На клиенте и сервере в этом случае, доступны дополнительные функции оптимизации вычислений, трафика и кеширования

## Презентации
- [Зачем это нужно](http://www.oknosoft.ru/presentations/zd_what_for.html)
- [Как это устроено](http://www.oknosoft.ru/presentations/zd_how.html)
 
## Концепция
Наиболее ценными из предоставляемых платформой 1С инструментов, на наш взгляд являются:
- Эффективная модель *Метаданных* со *ссылочной типизацией* и *подробным описанием полей объектов*. Есть примеры реальных production систем 1С без единой строчки клиентского кода. Для решения большинства задач достаточно форм, которые платформа генерирует автоматически по свойствам метаданных
- Высокоуровневая объектная модель данных. Предопределенное (при необходимости, переопределяемое) поведение *Документов*, *Регистров*, *Справочников* и *Менеджеров объектов*, наличие *стандартных реквизитов* и *событий*, повышает эффективность разработки *в разы* по сравнению с фреймворками, оперирующими записями реляционных таблиц
 
Чтобы предоставить разработчику на javascript инструментарий, подобный 1С-ному, на верхнем уровне фреймворка реализованы следующие классы:
- [AppEvents](http://www.oknosoft.ru/upzp/apidocs/classes/AppEvents.html), обслуживающий события при старте программы, авторизацию пользователей и состояния сети
- [Meta](http://www.oknosoft.ru/upzp/apidocs/classes/Meta.html) - хранилище метаданных конфигурации
- [DataManager](http://www.oknosoft.ru/upzp/apidocs/classes/DataManager.html) с наследниками RefDataManager, EnumManager, InfoRegManager, CatManager, DocManager - менеджеры объектов данных - аналоги 1С-ных ПеречислениеМенеджер, РегистрСведенийМенеджер, СправочникМенеджер, ДокументМенеджер
- [DataObj](http://www.oknosoft.ru/upzp/apidocs/classes/DataObj.html) с наследниками CatObj, DocObj, EnumObj, DataProcessorObj - аналоги 1С-ных СправочникОбъект, ДокументОбъект, ОбработкаОбъект

## Благодарности
* Andrey Gershun, author of [AlaSQL](https://github.com/agershun/alasql) - Javascript SQL database library
* Авторам [dhtmlx](http://dhtmlx.com/) - a beautiful set of Ajax-powered UI components
* Прочим авторам за их замечательные инструменты, упрощающие нашу работу

## Лицензия
Доступ к материалам данного репозитоиря (далее по тексту ПО - программное обеспечение), предоставляется **исключительно в личных информационно-ознакомительных целях**. При возникновении необходимости иного использования полученных материалов, следует обратиться к Правообладателю (info@oknosoft.ru) для заключения [договора на передачу имущественных прав](http://www.oknosoft.ru/programmi-oknosoft/metadata.html).

- Распространение ПО как самостоятельного продукта запрещено
- Распространение ПО в составе продуктов, являющихся конкурентами metadata.js, или обладающих схожей с функциональностью - запрещено
- Коммерческая [лицензия на разработчика](http://www.oknosoft.ru/programmi-oknosoft/metadata.html) позволяет использовать и распространять ПО в любом количестве неконкурирующих продуктов, без ограничений на количество копий

Данная лицензия распространяется на все содержимое репозитория, но не заменяют существующие лицензии для продуктов, используемых библиотекой metadata.js

(c) 2010-2015, компания Окнософт (info@oknosoft.ru)
