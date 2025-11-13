const getAnchorHref = (element: HTMLElement): string | null => {
    const anchor = element.closest('a')
    return anchor && anchor instanceof HTMLAnchorElement ? anchor.getAttribute('href') : null
}

export { getAnchorHref }
