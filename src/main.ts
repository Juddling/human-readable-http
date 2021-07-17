type Category = {
    name: string,
    headers: ReadableHeader[],
};

type ReadableHeader = {
    name: string,
    value: string,
};

enum CategoryType {
    CONTENT,
    CACHING,
    MISC,
    CDN,
    SECURITY,
}

const headerToCategoryMap = new Map<string, CategoryType>([
    // content
    ["content-type", CategoryType.CONTENT],
    ["content-length", CategoryType.CONTENT],
    // caching
    ["age", CategoryType.CACHING],
    ["cache-control", CategoryType.CACHING],
    ["etag", CategoryType.CACHING],
    ["last-modified", CategoryType.CACHING],
    ["pragma", CategoryType.CACHING],
    ["expires", CategoryType.CACHING],
    // cloudflare
    ["cf-ray", CategoryType.CDN],
    ["cf-cache-status", CategoryType.CDN],
]);

function categoriseHeader(headerName: string): CategoryType {
    const category = headerToCategoryMap.get(headerName);
    return category != null ? category : CategoryType.MISC;
}

function readableCategoryName(category: CategoryType): string {
    switch (category) {
        case CategoryType.CACHING:
            return '<i class="bi bi-save"></i> Caching';
        case CategoryType.CONTENT:
            return '<i class="bi bi-file-code"></i> Content';
        case CategoryType.CDN:
            return '<i class="bi bi-cloud"></i> CDN';
        case CategoryType.MISC:
            return '<i class="bi bi-emoji-smile-upside-down"></i> Miscellaneous';
        case CategoryType.SECURITY:
            return '<i class="bi bi-lock"></i> Security';
    }
}

function readableSeconds(seconds: number): string {
    if (seconds > 86400) {
        return `${Math.floor(seconds / 86400)} days`;
    }
    return `${Math.floor(seconds / 3600)} hours`;
}

function readableSize(bytes: number): string {
    // TODO: add MB
    return `${Math.floor(bytes / 1024)} KB`;
}

function readableHeaderValue(headerName: string, value: string) {
    switch (headerName) {
        case 'age':
            return readableSeconds(Number.parseInt(value));
        case 'content-length':
            return readableSize(Number.parseInt(value));
    }
    return value;
}

function parse(response: string): Category[] {
    const headerPairs = /(?<name>[A-Za-z-]+):\s?(?<value>(.+))$/gm;
    const headerMatches = response.matchAll(headerPairs);
    const categorisedResponse: Map<CategoryType, Category> = new Map();
    for (const match of headerMatches) {
        if (match.groups) {
            const categoryType = categoriseHeader(match.groups['name']);
            const category = categorisedResponse.get(categoryType);
            const readableHeader = {
                name: match.groups['name'],
                value: readableHeaderValue(match.groups['name'], match.groups['value']),
            };
            if (category) {
                category.headers.push(readableHeader);
            } else {
                categorisedResponse.set(categoryType, {
                    name: readableCategoryName(categoryType),
                    headers: [readableHeader],
                });
            }
        }
    }
    return [...categorisedResponse.values()];
}

// DOM stuff
const parseButton = document.getElementById('parseButton');
const responseTextarea = document.getElementById('response') as HTMLTextAreaElement;
const exampleResponseElement = document.getElementById('exampleResponse') as HTMLScriptElement;
const results = document.getElementById('results');

function renderReadableHeaders(headers: ReadableHeader[]): string {
    let html = '<ul>';
    for (const header of headers) {
        html += `<li>${header.name}: ${header.value}</li>`;
    }
    html += '</ul>';
    return html;
}

function renderResults(categories: Category[]) {
    let html = '';
    for (const category of categories) {
        html += `<h3>${category.name}</h3>`;
        html += renderReadableHeaders(category.headers);
    }
    results.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', (event) => {
    parseButton.addEventListener('click', () => {
        const readableResult = parse(responseTextarea.value);
        renderResults(readableResult);
    });
    document.getElementById('loadExample').addEventListener('click', () => {
        responseTextarea.value = exampleResponseElement.text;
    });
});
