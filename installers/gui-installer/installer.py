from tkinter import *
import tkinter.filedialog
from tkinter.ttk import Progressbar
from os.path import expanduser

import os
import platform
import sys
from os import path
import asyncio
import threading

bundle_dir = path.abspath(path.dirname(__file__))
path_to_dist = path.join(bundle_dir, 'dist.zip')

root = Tk()
root.title("WebMC Installer")
root.minsize(500, 355)
root.maxsize(500, 355)

top_frame = Frame(root)
top_frame.pack(fill=BOTH, expand=True)

current_page = 0
pages = [Frame(top_frame), Frame(top_frame), Frame(top_frame)]
# page 0
label = Label(pages[0], text="This tool will install WebMC on your computor.")
label.pack(anchor=CENTER)
# page 1
label = Label(pages[1], text="Instal WebMC to:")
label.grid(sticky=W, padx=30, pady=30)

label = Label(pages[1], text="Containing folder:")
label.grid(sticky=W, padx=30)
containing_folder_text = StringVar()
containing_folder = Entry(pages[1], textvariable=containing_folder_text, width=30)
containing_folder.grid(sticky=W, padx=30)
containing_folder_text.set(expanduser("~\Documents"))

label = Label(pages[1], text="Application folder:")
label.grid(sticky=W, padx=30)
folder_text = StringVar()
folder = Entry(pages[1], textvariable=folder_text, width=30)
folder.grid(sticky=W, padx=30, pady=3)
folder_text.set("WebMC")

def change():
    containing_folder_text.set(tkinter.filedialog.askdirectory(mustexist=True))
change_button = Button(pages[1], text="Change", width=10, command=change)
change_button.grid(sticky=W, padx=30)
# page 2
label = Label(pages[2], text="Choose a username and password for WebMC.\nYou will use them to manage your minecraft server.", justify=LEFT)
label.grid(sticky=W, padx=30, pady=30)

label = Label(pages[2], text="Username:")
label.grid(sticky=W, padx=30)
username_text = StringVar()
username = Entry(pages[2], textvariable=username_text, width=30)
username.grid(sticky=W, padx=30, pady=3)

label = Label(pages[2], text="Password:")
label.grid(sticky=W, padx=30)
password_text = StringVar()
password = Entry(pages[2], textvariable=password_text, width=30, show="*")
password.grid(sticky=W, padx=30, pady=3)

label = Label(pages[2], text="Confirm Password:")
label.grid(sticky=W, padx=30)
confirm_password_text = StringVar()
confirm_password = Entry(pages[2], textvariable=confirm_password_text, width=30, show="*")
confirm_password.grid(sticky=W, padx=30, pady=3)

pages[0].pack(fill=BOTH, expand=True)

def cancel():
    sys.exit(0)
cancel_button = Button(root, text="Cancel", width=10, command=cancel)
cancel_button.pack(side=RIGHT, padx=20, pady=10)
async def run(cmd):
    proc = await asyncio.create_subprocess_shell(
        cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE)

    stdout, stderr = await proc.communicate()

    print(f'[{cmd!r} exited with {proc.returncode}]')
    if stdout:
        print(f'[stdout]\n{stdout.decode()}')
    if stderr:
        print(f'[stderr]\n{stderr.decode()}')
import subprocess
def install():
    folder = path.join(containing_folder_text.get(), folder_text.get())
    import zipfile
    with zipfile.ZipFile(path_to_dist, 'r') as zip_ref:
        zip_ref.extractall(folder)
    
    subprocess.run(['mkdir', path.join(folder, 'mc')], shell=True)
    subprocess.run(['mkdir', path.join(folder, 'mc/bedrock-server')], shell=True)
    subprocess.run([path.join(folder, 'node/node.exe'), 'app/scripts/install.js', username_text.get(), password_text.get()], cwd=folder)
    subprocess.run(path.join(folder, 'app/scripts/update_mc_server.bat'), cwd=folder)
def next():
    global current_page
    if current_page == len(pages) - 1:
        # install WebMC
        pages[len(pages) - 1].pack_forget()
        back_button.pack_forget()
        cancel_button.pack_forget()
        next_button.pack_forget()

        label = Label(top_frame, text="Downloading WebMC")
        label.grid(sticky=W, padx=30, pady=30)
        progressbar = Progressbar(top_frame)
        progressbar.grid(sticky=W, padx=30, ipadx=150)
        progressbar.start()
        if platform.system() == 'Windows':
            threading.Thread(target=install).start()
            # import subprocess
            # subprocess.Popen(['python', path.join(bundle_dir, 'sub.py'), path.join(containing_folder_text.get(), folder_text.get()), username_text.get(), password_text.get()])
            # subprocess.Popen(['powershell.exe', '-NoP', '-NonI', '-Command', f"Expand-Archive -Force \'{path_to_dist}\' \'{path.join(containing_folder_text.get(), folder_text.get())}/\'"])
    else:
        pages[current_page].pack_forget()
        current_page += 1
        pages[current_page].pack(fill=BOTH, expand=True)
        back_button["state"] = "normal"
        if current_page == len(pages) - 1:
            next_button["text"] = "Finish"
next_button = Button(root, text="Next", width=10, command=next)
next_button.pack(side=RIGHT, padx=1, pady=10)

def back():
    global current_page
    pages[current_page].pack_forget()
    current_page -= 1
    pages[current_page].pack(fill=BOTH, expand=True)
    next_button["text"] = "Next"
    if current_page == 0:
        back_button["state"] = "disabled"
back_button = Button(root, text="Back", width=10, command=back, state="disabled")
back_button.pack(side=RIGHT, padx=1, pady=10)

root.mainloop()