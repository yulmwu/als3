import argparse
import requests
import time
import uuid
import sys


def register(base_url, username, password, email, nickname=None, description=None):
    payload = {"username": username, "password": password, "email": email}
    if nickname is not None:
        payload["nickname"] = nickname
    if description is not None:
        payload["description"] = description
    r = requests.post(f"{base_url}/auth/register", json=payload)
    if r.status_code not in (200, 201):
        raise RuntimeError(f"register failed: {r.status_code} {r.text}")


def login(base_url, username, password):
    r = requests.post(f"{base_url}/auth/login", json={"username": username, "password": password})
    if r.status_code not in (200, 201):
        raise RuntimeError(f"login failed: {r.status_code} {r.text}")
    j = r.json()
    if isinstance(j, dict) and "accessToken" in j:
        return j["accessToken"]
    raise RuntimeError("invalid login response")


def create_directory(base_url, token, name, parent_uuid=None):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"name": name}
    if parent_uuid:
        payload["parentUuid"] = parent_uuid
    r = requests.post(f"{base_url}/files/directory", json=payload, headers=headers)
    if r.status_code not in (200, 201):
        raise RuntimeError(f"create directory failed: {r.status_code} {r.text}")
    j = r.json()
    if isinstance(j, dict) and "uuid" in j:
        return j["uuid"]
    raise RuntimeError("invalid directory response")


def build_chain(base_url, token, depth):
    parent = None
    for i in range(1, depth + 1):
        name = f"dir-{i:04d}"
        parent = create_directory(base_url, token, name, parent)
        if i % 50 == 0 or i == depth:
            print(f"created {i}/{depth} directories: {parent}")
    return parent


def measure_breadcrumb_once(base_url, token, uuid_value):
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{base_url}/files/uuid/{uuid_value}/breadcrumb"
    t0 = time.perf_counter()
    r = requests.get(url, headers=headers)
    t1 = time.perf_counter()
    if r.status_code != 200:
        raise RuntimeError(f"breadcrumb failed: {r.status_code} {r.text}")
    return (t1 - t0), r.json()


def measure_breadcrumb(base_url, token, uuid_value, times):
    results = []
    for _ in range(times):
        dt, _ = measure_breadcrumb_once(base_url, token, uuid_value)
        results.append(dt)
    results_ms = [x * 1000 for x in results]
    avg = sum(results_ms) / len(results_ms)
    p95 = sorted(results_ms)[int(len(results_ms) * 0.95) - 1 if len(results_ms) > 1 else 0]
    return results_ms[0], avg, p95


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:3000/api")
    parser.add_argument("--depth", type=int, default=200)
    parser.add_argument("--repeats", type=int, default=5)
    args = parser.parse_args()

    uid = uuid.uuid4().hex[:12]
    username = f"bench_{uid}"
    password = f"P@ssw0rd_{uid}!"
    email = f"{uid}@example.local"

    print(f"registering user: {username}")
    register(args.base_url, username, password, email)
    print("logging in")
    token = login(args.base_url, username, password)

    print(f"creating directory chain depth={args.depth}")
    deepest_uuid = build_chain(args.base_url, token, args.depth)

    print("warming up breadcrumb")
    _ = measure_breadcrumb_once(args.base_url, token, deepest_uuid)

    print(f"measuring breadcrumb for uuid={deepest_uuid}")
    first_ms, avg_ms, p95_ms = measure_breadcrumb(args.base_url, token, deepest_uuid, args.repeats)
    print(f"first_call_ms={first_ms:.2f}")
    print(f"avg_ms={avg_ms:.2f}")
    print(f"p95_ms={p95_ms:.2f}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(str(e))
        sys.exit(1)
