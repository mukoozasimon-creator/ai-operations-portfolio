// Apply the introduction's context before the workspace can paint.
        const entryContext = new URLSearchParams(location.search).get('context');
        document.documentElement.dataset.context = ['people', 'connections', 'progress', 'care'].includes(entryContext) ? entryContext : 'people';
