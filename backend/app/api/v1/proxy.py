from fastapi import APIRouter, Request, Response
import httpx

router = APIRouter()

NATIVE_HERMES_PORT = 8501  # Default native dashboard port

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def proxy_native_dashboard(request: Request, path: str):
    url = f"http://localhost:{NATIVE_HERMES_PORT}/{path}"
    
    async with httpx.AsyncClient() as client:
        body = await request.body()
        headers = dict(request.headers)
        
        # Remove host header so httpx uses the correct target host
        if "host" in headers:
            del headers["host"]
            
        try:
            proxy_response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                params=request.query_params
            )
            
            # Exclude headers that might cause issues when returning the response
            excluded_headers = ["content-encoding", "content-length", "transfer-encoding", "connection"]
            resp_headers = {
                name: value
                for name, value in proxy_response.headers.items()
                if name.lower() not in excluded_headers
            }
            
            return Response(
                content=proxy_response.content,
                status_code=proxy_response.status_code,
                headers=resp_headers
            )
        except httpx.RequestError as exc:
            return Response(content=f"Proxy error: {str(exc)}", status_code=502)
