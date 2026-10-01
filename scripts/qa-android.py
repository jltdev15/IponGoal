"""Optional emulator QA helper; only targets emulator-5554, never a physical phone."""
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
import os
import shutil
ADB = shutil.which('adb') or os.path.join(os.environ.get('ANDROID_HOME', os.path.expanduser('~/Library/Android/sdk')), 'platform-tools/adb')
SERIAL = os.environ.get('IPON_QA_EMULATOR', 'emulator-5554')
if not SERIAL.startswith('emulator-'): raise ValueError('This helper only supports emulators.')
def adb(*args):
    return subprocess.check_output([ADB, '-s', SERIAL, *args], text=True)
def nodes():
    for attempt in range(3):
        status = adb('shell', 'uiautomator', 'dump', '/sdcard/ipon-qa.xml')
        if 'dumped' in status: break
    else: raise RuntimeError('Unable to read a fresh screen')
    raw = adb('shell', 'cat', '/sdcard/ipon-qa.xml')
    return list(ET.fromstring(raw).iter('node'))
def tap(label):
    found = [n for n in nodes() if n.get('content-desc', '').casefold() == label.casefold()] or [n for n in nodes() if n.get('text', '').casefold() == label.casefold()]
    if not found: raise RuntimeError('Visible control not found: ' + label)
    coords = [int(v) for v in re.findall(r'\d+', found[0].get('bounds'))]
    adb('shell', 'input', 'tap', str((coords[0]+coords[2])//2), str((coords[1]+coords[3])//2))
if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'tap': tap(sys.argv[2])
    elif mode == 'fill':
        tap(sys.argv[2]); time.sleep(0.4)
        for character in sys.argv[3]:
            adb('shell','input','text','%s' if character == ' ' else character); time.sleep(0.10)
        adb('shell','input','keyevent','4')
    elif mode == 'swipe':
        size = adb('shell','wm','size').splitlines()[-1].split(':')[-1].strip()
        width, height = map(int, size.split('x'))
        adb('shell','input','swipe',str(width//2),str(int(height*0.85)),str(width//2),str(int(height*0.29)),'450')
    elif mode == 'back': adb('shell','input','keyevent','4')
    elif mode == 'shot':
        with open(sys.argv[2],'wb') as output: subprocess.run([ADB,'-s',SERIAL,'exec-out','screencap','-p'],stdout=output,check=True)
    if mode != 'shot':
        for node in nodes():
            label = node.get('content-desc') or node.get('text')
            if label: print(node.get('class').split('.')[-1],repr(label),node.get('bounds'))
