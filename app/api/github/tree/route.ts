import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const { searchParams } = new URL(req.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const path = searchParams.get('path') || '';
    const query = searchParams.get('q')?.trim().toLowerCase();
    const recursive = searchParams.get('recursive') === 'true';

    if (!owner || !repo) {
        return NextResponse.json({ error: 'Missing owner or repo param' }, { status: 400 });
    }

    const octokit = new Octokit({ auth: token });

    try {
        if (recursive) {
            const { data } = await octokit.rest.git.getTree({
                owner, repo, tree_sha: searchParams.get('ref') || 'HEAD', recursive: 'true',
            });
            const items = data.tree
                .filter(item => item.type === 'blob' && item.path)
                .filter(item => !query || item.path!.toLowerCase().includes(query))
                .slice(0, 5000)
                .map(item => ({ name: item.path!.split('/').pop(), path: item.path, type: 'file', sha: item.sha }));
            return NextResponse.json({ items, truncated: data.truncated });
        }
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
        });

        const items = Array.isArray(data) ? data : [data];
        
        // Sort: Folders first, then files
        const sortedItems = items.map(item => ({
            name: item.name,
            path: item.path,
            type: item.type, // 'file' or 'dir'
            sha: item.sha
        })).sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'dir' ? -1 : 1;
        });

        return NextResponse.json({ items: sortedItems });
    } catch (err: any) {
        // If path doesn't exist or is empty repo
        if(err.status === 404) {
             return NextResponse.json({ items: [] });
        }
        throw err;
    }

  } catch (error: any) {
    console.error('GitHub Tree API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch repository contents', 
      details: error.message 
    }, { status: 500 });
  }
}
