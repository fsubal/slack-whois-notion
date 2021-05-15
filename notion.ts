import ky from "https://unpkg.com/ky@0.24.0/index.js";

const {
  NOTION_API_KEY,
  NOTION_VERSION = '2021-05-13',
  NOTION_WORKSPACE_NAME,
  DATABASE_ID,
  DATABASE_FILTER_BY = 'Nickname'
} = process.env

const api = ky.extend({
  prefixUrl: 'https://api.notion.com/v1',
	hooks: {
		beforeRequest: [
			request => {
				request.headers.set('Authorization', `Bearer "${NOTION_API_KEY}"`);
        request.headers.set('Notion-Version', NOTION_VERSION)
			}
		]
	}
});

export async function getProfileUrlsFromNotion(userName: string): Promise<string[]> {
  const queryResult = await api.post(`/databases/${DATABASE_ID}/query`, {
    filter: {
      property: DATABASE_FILTER_BY,
      text: {
        contains: userName
      }
    }
  }).json()

  return queryResult.results.map(result => `https://www.notion.so/${NOTION_WORKSPACE_NAME}/${result.id}`)
}
