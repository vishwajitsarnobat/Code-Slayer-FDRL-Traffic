import asyncio
import websockets
import json

async def test():
    uri = "ws://localhost:8080"
    try:
        async with websockets.connect(uri) as websocket:
            print("✓ Connected successfully")
            
            # Send start command
            await websocket.send(json.dumps({'action': 'start_simulation'}))
            print("✓ Sent start command")
            
            # Wait for response
            for i in range(5):
                message = await websocket.recv()
                data = json.loads(message)
                print(f"✓ Received: {data.get('type', 'unknown')}")
                
    except Exception as e:
        print(f"✗ Error: {e}")

asyncio.run(test())
